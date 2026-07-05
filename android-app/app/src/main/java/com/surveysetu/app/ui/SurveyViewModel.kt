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
        // ALWAYS attempt to load local first, but trigger sync if local is empty
        loadLocalSurvey(triggerSyncIfEmpty = true)
    }

    fun loadLocalSurvey(triggerSyncIfEmpty: Boolean = false) {
        _surveyState.value = SurveyState.Loading
        viewModelScope.launch {
            try {
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
                    Log.d("SurveyViewModel", "Successfully loaded local survey: ${survey.title}")
                } else if (triggerSyncIfEmpty) {
                    Log.i("SurveyViewModel", "Local DB empty. Triggering automatic cloud sync...")
                    syncSurveys()
                } else {
                    _surveyState.value = SurveyState.Error("No active survey found. Click Sync to fetch from cloud.")
                }
            } catch (e: Exception) {
                Log.e("SurveyViewModel", "Local load error", e)
                _surveyState.value = SurveyState.Error("Database Error: ${e.message}")
            }
        }
    }

    fun syncSurveys() {
        _surveyState.value = SurveyState.Loading
        viewModelScope.launch {
            Log.i("SurveyViewModel", "Starting Cloud Sync...")
            val result = repository.syncActiveSurveys()
            if (result.isSuccess) {
                Log.i("SurveyViewModel", "Sync Successful. Reloading local data.")
                loadLocalSurvey(triggerSyncIfEmpty = false)
            } else {
                val error = result.exceptionOrNull()?.message ?: "Unknown Sync Error"
                Log.e("SurveyViewModel", "Sync Failed: $error")
                _surveyState.value = SurveyState.Error("Sync failed: $error")
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
