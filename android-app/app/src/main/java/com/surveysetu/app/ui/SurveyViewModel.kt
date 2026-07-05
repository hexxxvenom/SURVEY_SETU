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
        // Load everything at once so transitions are instant
        loadLocalSurveys(triggerSyncIfEmpty = true)
    }

    fun loadLocalSurveys(triggerSyncIfEmpty: Boolean = false) {
        // Only show loading if we have absolutely nothing
        if (_surveyState.value !is SurveyState.Success) {
            _surveyState.value = SurveyState.Loading
        }
        
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
                    // DATA IS NOW FULLY CACHED IN STATE
                    _surveyState.value = SurveyState.Success(surveysWithQuestions)
                    Log.d("SurveyViewModel", "Data Pre-loaded for instant access.")
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
