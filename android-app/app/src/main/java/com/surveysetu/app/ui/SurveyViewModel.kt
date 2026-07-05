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
    data class Success(val survey: SurveyEntity, val questions: List<QuestionUiModel>) : SurveyState()
    data class Error(val message: String) : SurveyState()
}

class SurveyViewModel(
    val repository: SurveyRepository,
    private val surveyDao: SurveyDao
) : ViewModel() {

    private val _surveyState = MutableStateFlow<SurveyState>(SurveyState.Loading)
    val surveyState: StateFlow<SurveyState> = _surveyState.asStateFlow()
    
    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    init {
        loadLocalSurvey(triggerSyncIfEmpty = true)
    }

    fun loadLocalSurvey(triggerSyncIfEmpty: Boolean = false) {
        _surveyState.value = SurveyState.Loading
        viewModelScope.launch {
            try {
                // REAL-TIME SECURITY LOCK: Force check cloud status
                val me = RetrofitClient.apiService.getMe()
                if (me.code() == 401 || me.code() == 403 || (me.isSuccessful && me.body()?.status == "LOCKED")) {
                    _surveyState.value = SurveyState.Error("ACCOUNT_LOCKED")
                    return@launch
                }

                val survey = surveyDao.getActiveSurvey()
                if (survey != null) {
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
                    _surveyState.value = SurveyState.Success(survey, uiQuestions)
                } else if (triggerSyncIfEmpty) {
                    syncSurveys()
                } else {
                    _surveyState.value = SurveyState.Error("No active survey found. Click Sync.")
                }
            } catch (e: Exception) {
                // Fallback to local if totally offline
                val local = surveyDao.getActiveSurvey()
                if (local != null) {
                    val questions = surveyDao.getQuestionsForSurvey(local.id)
                    val uiQuestions = questions.map { q ->
                        val options = surveyDao.getOptionsForQuestion(q.id)
                        QuestionUiModel(
                            id = q.id,
                            text = q.questionText,
                            isMandatory = q.isMandatory,
                            options = options.map { o -> OptionUiModel(o.id, o.optionText) }
                        )
                    }
                    _surveyState.value = SurveyState.Success(local, uiQuestions)
                } else {
                    _surveyState.value = SurveyState.Error("Cloud connection required for first shift.")
                }
            }
        }
    }

    fun syncSurveys() {
        _surveyState.value = SurveyState.Loading
        viewModelScope.launch {
            val result = repository.syncActiveSurveys()
            if (result.isSuccess) {
                loadLocalSurvey(triggerSyncIfEmpty = false)
            } else {
                _surveyState.value = SurveyState.Error("Sync failed. Check cloud connection.")
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
                deviceId = "HW_AUTODETECT",
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
