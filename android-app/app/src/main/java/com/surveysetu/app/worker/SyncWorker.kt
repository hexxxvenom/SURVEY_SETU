package com.surveysetu.app.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.surveysetu.app.data.RetrofitClient
import com.surveysetu.app.data.SurveyDatabase
import androidx.room.Room
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val db = Room.databaseBuilder(
                applicationContext,
                SurveyDatabase::class.java, "survey-db"
            ).build()
            
            val dao = db.surveyDao()
            val api = RetrofitClient.apiService
            val unsynced = dao.getUnsyncedResponses()

            var allSuccess = true

            for (response in unsynced) {
                // Convert to RequestBody Parts
                val surveyIdPart = response.surveyId.toRequestBody("text/plain".toMediaTypeOrNull())
                val surveyVersionPart = response.surveyVersion.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                val deviceIdPart = response.deviceId.toRequestBody("text/plain".toMediaTypeOrNull())
                
                // In a real app, we would fetch answers from the DB and convert to JSON
                val answersPart = "[]".toRequestBody("application/json".toMediaTypeOrNull())
                
                val gpsLatPart = response.gpsLat?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
                val gpsLngPart = response.gpsLng?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())

                val apiResponse = api.submitResponse(
                    surveyId = surveyIdPart,
                    surveyVersion = surveyVersionPart,
                    deviceId = deviceIdPart,
                    gpsLat = gpsLatPart,
                    gpsLng = gpsLngPart,
                    answers = answersPart,
                    respondentPhoto = null
                )

                if (apiResponse.isSuccessful) {
                    dao.markResponseSynced(response.id)
                } else {
                    allSuccess = false
                }
            }

            if (allSuccess) Result.success() else Result.retry()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
}
