package com.surveysetu.app.data

import com.surveysetu.app.ui.AnswerUiModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SurveyRepository(
    private val apiService: ApiService,
    private val surveyDao: SurveyDao
) {

    suspend fun syncActiveSurveys(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getActiveSurveys()
            if (response.isSuccessful) {
                val surveys = response.body() ?: return@withContext Result.failure(Exception("Empty body"))
                
                // Clear and update local cache
                // In a real app, we might want to be more surgical about updates
                surveys.forEach { surveyDto ->
                    surveyDao.insertSurvey(
                        SurveyEntity(
                            id = surveyDto.id,
                            title = surveyDto.title,
                            version = surveyDto.version,
                            isPublished = true
                        )
                    )
                    
                    val questions = surveyDto.questions.map { q ->
                        QuestionEntity(
                            id = q.id,
                            surveyId = surveyDto.id,
                            questionText = q.questionText,
                            orderIndex = q.orderIndex,
                            isMandatory = q.isMandatory,
                            optionCount = q.optionCount
                        )
                    }
                    surveyDao.insertQuestions(questions)
                    
                    surveyDto.questions.forEach { q ->
                        val options = q.options.map { o ->
                            OptionEntity(
                                id = o.id,
                                questionId = q.id,
                                optionText = o.optionText,
                                orderIndex = o.orderIndex
                            )
                        }
                        surveyDao.insertOptions(options)
                    }
                }
                Result.success(Unit)
            } else {
                Result.failure(Exception("API Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun saveResponseLocally(
        surveyId: String,
        version: Int,
        deviceId: String,
        surveyorId: String,
        lat: Double?,
        lng: Double?,
        photoPath: String?,
        answers: List<AnswerUiModel>
    ) = withContext(Dispatchers.IO) {
        val responseId = java.util.UUID.randomUUID().toString()
        val entity = ResponseEntity(
            id = responseId,
            surveyId = surveyId,
            surveyVersion = version,
            deviceId = deviceId,
            surveyorId = surveyorId,
            gpsLat = lat,
            gpsLng = lng,
            respondentPhotoPath = photoPath,
            answersJson = "", // Using AnswerEntity
            isSynced = false
        )
        
        val answerEntities = answers.map { 
            AnswerEntity(
                responseId = responseId,
                questionId = it.questionId,
                selectedOptionId = it.selectedOptionId
            )
        }
        
        surveyDao.insertResponse(entity)
        surveyDao.insertAnswers(answerEntities)
    }
}
