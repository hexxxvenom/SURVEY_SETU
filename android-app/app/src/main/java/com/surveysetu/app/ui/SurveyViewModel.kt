package com.surveysetu.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.surveysetu.app.data.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

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
                _surveyState.value = SurveyState.Error("No active survey cached. Please sync.")
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
                _surveyState.value = SurveyState.Error("Sync failed: ${result.exceptionOrNull()?.message}")
            }
        }
    }

    fun submitSurvey(
        survey: SurveyEntity, 
        answers: List<AnswerUiModel>, 
        photoPath: String?,
        gps: Pair<Double, Double>?,
        onComplete: () -> Unit
    ) {
        _isSubmitting.value = true
        viewModelScope.launch {
            repository.saveResponseLocally(
                surveyId = survey.id,
                version = survey.version,
                deviceId = "DEVICE_ID_PLACEHOLDER", 
                surveyorId = "SURVEYOR_ID_PLACEHOLDER",
                lat = gps?.first,
                lng = gps?.second,
                photoPath = photoPath,
                answers = answers
            )
            _isSubmitting.value = false
            onComplete()
        }
    }
}
