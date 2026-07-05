package com.surveysetu.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.surveysetu.app.data.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import android.util.Log

sealed class SurveyState {
    object Loading : SurveyState()
    data class Success(val surveys: List<SurveyWithQuestions>) : SurveyState()
    data class SingleSuccess(val survey: SurveyEntity, val questions: List<QuestionUiModel>) : SurveyState()
    data class Error(val message: String) : SurveyState()
}

data class SurveyWithQuestions(
    val survey: SurveyEntity,
    val questions: List<QuestionUiModel>
)

class SurveyViewModel(
    val repository: SurveyRepository,
    private val surveyDao: SurveyDao
) : ViewModel() {

    private val _surveyState = MutableStateFlow<SurveyState>(SurveyState.Loading)
    val surveyState: StateFlow<SurveyState> = _surveyState.asStateFlow()
    
    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    init {
        loadLocalSurveys(triggerSyncIfEmpty = true)
    }

    fun loadLocalSurveys(triggerSyncIfEmpty: Boolean = false) {
        _surveyState.value = SurveyState.Loading
        viewModelScope.launch {
            try {
                // REAL-TIME SECURITY LOCK
                val me = RetrofitClient.apiService.getMe()
                if (me.code() == 401 || me.code() == 403 || (me.isSuccessful && me.body()?.status == "LOCKED")) {
                    _surveyState.value = SurveyState.Error("ACCOUNT_LOCKED")
                    return@launch
                }

                val localSurveys = surveyDao.getAllActiveSurveys()
                if (localSurveys.isNotEmpty()) {
                    val surveysWithQuestions = localSurveys.map { survey ->
                        val questions = surveyDao.getQuestionsForSurvey(survey.id)
                        val uiQuestions = questions.map { q ->
                            val options = surveyDao.getOptionsForQuestion(q.id)
                            QuestionUiModel(
                                id = q.id,
                                text = q.questionText,
                                isMandatory = q.isMandatory,
                                options = options.map { o -> OptionUiModel(o.id, o.optionText) }
                            )
                        }
                        SurveyWithQuestions(survey, uiQuestions)
                    }
                    _surveyState.value = SurveyState.Success(surveysWithQuestions)
                } else if (triggerSyncIfEmpty) {
                    syncSurveys()
                } else {
                    _surveyState.value = SurveyState.Error("No data found. Please check Cloud Sync.")
                }
            } catch (e: Exception) {
                Log.e("SurveyViewModel", "Load failed", e)
                _surveyState.value = SurveyState.Error("Connection Error: Check Internet")
            }
        }
    }

    fun loadSingleSurvey(surveyId: String) {
        // ULTIMATE STABILITY: Skip loading if already showing the correct data
        val currentState = _surveyState.value
        if (currentState is SurveyState.SingleSuccess && currentState.survey.id == surveyId) {
            return
        }

        // Show spinner while fetching from local DB
        _surveyState.value = SurveyState.Loading
        
        viewModelScope.launch {
            try {
                val survey = surveyDao.getAllActiveSurveys().find { it.id == surveyId }
                if (survey != null) {
                    val questions = surveyDao.getQuestionsForSurvey(survey.id)
                    
                    // CRITICAL FIX: Ensure questions exist before switching state
                    if (questions.isEmpty()) {
                        _surveyState.value = SurveyState.Error("Missing questions in this survey mission.")
                        return@launch
                    }

                    val uiQuestions = questions.map { q ->
                        val options = surveyDao.getOptionsForQuestion(q.id)
                        QuestionUiModel(
                            id = q.id,
                            text = q.questionText,
                            isMandatory = q.isMandatory,
                            options = options.map { o -> OptionUiModel(o.id, o.optionText) }
                        )
                    }
                    _surveyState.value = SurveyState.SingleSuccess(survey, uiQuestions)
                    Log.i("SurveyViewModel", "Successfully entered Mission: ${survey.title}")
                } else {
                    _surveyState.value = SurveyState.Error("Mission details not found locally.")
                }
            } catch (e: Exception) {
                Log.e("SurveyViewModel", "Single load error", e)
                _surveyState.value = SurveyState.Error("Critical: Failed to build mission UI.")
            }
        }
    }

    fun syncSurveys() {
        _surveyState.value = SurveyState.Loading
        viewModelScope.launch {
            val result = repository.syncActiveSurveys()
            if (result.isSuccess) {
                loadLocalSurveys(triggerSyncIfEmpty = false)
            } else {
                _surveyState.value = SurveyState.Error("Cloud Sync Failed: ${result.exceptionOrNull()?.message}")
            }
        }
    }

    fun submitSurvey(
        survey: SurveyEntity, 
        answers: Map<String, String>, 
        respondentName: String,
        respondentContact: String,
        onComplete: () -> Unit
    ) {
        _isSubmitting.value = true
        viewModelScope.launch {
            val answerList = answers.map { AnswerUiModel(it.key, it.value) }
            repository.saveResponseLocally(
                surveyId = survey.id,
                version = survey.version,
                deviceId = "HW_VERIFIED",
                surveyorId = DatabaseProvider.sessionManager.getUserId() ?: "UNKNOWN",
                lat = null,
                lng = null,
                photoPath = null,
                answers = answerList
            )
            _isSubmitting.value = false
            onComplete()
        }
    }
}
