package com.surveysetu.app.data

import com.surveysetu.app.ui.AnswerUiModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import android.util.Log
import com.google.gson.Gson

class SurveyRepository(
    private val apiService: ApiService,
    private val surveyDao: SurveyDao
) {

    suspend fun clockIn(deviceId: String, lat: Double?, lng: Double?, selfieFile: File?): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val deviceIdPart = deviceId.toRequestBody("text/plain".toMediaTypeOrNull())
            val latPart = lat?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val lngPart = lng?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            
            val selfiePart = selfieFile?.let {
                val requestFile = it.asRequestBody("image/jpeg".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("selfie", it.name, requestFile)
            }

            val response = apiService.clockIn(deviceIdPart, latPart, lngPart, selfiePart)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Clock-in failed: ${response.code()}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun clockOut(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.clockOut()
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Clock-out failed"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun syncActiveSurveys(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d("SurveyRepository", "Syncing surveys from cloud...")
            val response = apiService.getActiveSurveys()
            if (response.isSuccessful) {
                val surveys = response.body() ?: return@withContext Result.failure(Exception("Cloud returned empty data"))
                
                // Nuclear Sync: Wipe old
                surveyDao.clearAllOptions()
                surveyDao.clearAllQuestions()
                surveyDao.clearAllSurveys()
                
                surveys.forEach { surveyDto ->
                    surveyDao.insertSurvey(
                        SurveyEntity(
                            id = surveyDto.id,
                            title = surveyDto.title,
                            version = surveyDto.version,
                            isPublished = true,
                            language = surveyDto.language
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

    // REAL-TIME CLOUD SUBMISSION ENGINE
    suspend fun uploadResponse(
        surveyId: String,
        version: Int,
        deviceId: String,
        lat: Double?,
        lng: Double?,
        name: String,
        contact: String,
        answers: List<AnswerUiModel>
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val surveyIdPart = surveyId.toRequestBody("text/plain".toMediaTypeOrNull())
            val versionPart = version.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val deviceIdPart = deviceId.toRequestBody("text/plain".toMediaTypeOrNull())
            val latPart = lat?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val lngPart = lng?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val namePart = name.toRequestBody("text/plain".toMediaTypeOrNull())
            val contactPart = contact.toRequestBody("text/plain".toMediaTypeOrNull())
            
            // Format answers as required by backend
            val answerRequests = answers.map { 
                mapOf("question_id" to it.questionId, "selected_option_id" to it.selectedOptionId)
            }
            val answersJson = Gson().toJson(answerRequests).toRequestBody("application/json".toMediaTypeOrNull())

            val response = apiService.submitResponse(
                surveyIdPart, versionPart, deviceIdPart, 
                latPart, lngPart, namePart, contactPart, 
                answersJson, null
            )

            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Cloud rejection: ${response.code()}"))
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
            answersJson = Gson().toJson(answers),
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
