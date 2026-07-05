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
                // AUTH STATUS CHECK
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
                    _surveyState.value = SurveyState.Error("Mission library empty.")
                }
            } catch (e: Exception) {
                _surveyState.value = SurveyState.Error("Offline: Connect to Cloud")
            }
        }
    }

    fun loadSingleSurvey(surveyId: String) {
        // PREVENT RACE CONDITION: If already in SingleSuccess for this ID, do not reload
        val current = _surveyState.value
        if (current is SurveyState.SingleSuccess && current.survey.id == surveyId) {
            Log.d("SurveyViewModel", "Bypassing redundant load for ID: $surveyId")
            return
        }

        _surveyState.value = SurveyState.Loading
        
        viewModelScope.launch {
            try {
                Log.i("SurveyViewModel", "Loading Mission: $surveyId")
                val survey = surveyDao.getAllActiveSurveys().find { it.id == surveyId }
                if (survey != null) {
                    val questions = surveyDao.getQuestionsForSurvey(survey.id)
                    
                    if (questions.isEmpty()) {
                        Log.e("SurveyViewModel", "No questions found in DB for ID: $surveyId")
                        _surveyState.value = SurveyState.Error("Data corrupted. Perform Cloud Sync.")
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
                    Log.i("SurveyViewModel", "Mission Ready: ${survey.title} (${uiQuestions.size} Qs)")
                } else {
                    Log.e("SurveyViewModel", "Survey not found in local DB: $surveyId")
                    _surveyState.value = SurveyState.Error("Mission data not found.")
                }
            } catch (e: Exception) {
                Log.e("SurveyViewModel", "Mission load error", e)
                _surveyState.value = SurveyState.Error("System Glitch: ${e.message}")
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
                _surveyState.value = SurveyState.Error("Sync Barrier: ${result.exceptionOrNull()?.message}")
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
                deviceId = "VERIFIED_HW", 
                surveyorId = DatabaseProvider.sessionManager.getUserId() ?: "---",
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
