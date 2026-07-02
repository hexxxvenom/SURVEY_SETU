package com.surveysetu.app.data

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @Multipart
    @POST("auth/selfie-verify")
    suspend fun verifySelfie(
        @Part("sessionId") sessionId: RequestBody,
        @Part selfie: MultipartBody.Part
    ): Response<Unit>

    @GET("surveys/active")
    suspend fun getActiveSurveys(): Response<List<SurveyResponse>>

    @Multipart
    @POST("responses")
    suspend fun submitResponse(
        @Part("survey_id") surveyId: RequestBody,
        @Part("survey_version") surveyVersion: RequestBody,
        @Part("device_id") deviceId: RequestBody,
        @Part("gps_lat") gpsLat: RequestBody?,
        @Part("gps_lng") gpsLng: RequestBody?,
        @Part("answers") answers: RequestBody, // JSON string of List<AnswerRequest>
        @Part respondentPhoto: MultipartBody.Part?
    ): Response<Unit>

    @GET("responses/history")
    suspend fun getHistory(
        @Query("page") page: Int,
        @Query("pageSize") pageSize: Int
    ): Response<HistoryResponse>
}

data class HistoryResponse(
    val data: List<ResponseEntity>,
    val meta: Meta
)

data class Meta(
    val page: Int,
    val pageSize: Int,
    val total: Int,
    val totalPages: Int
)
