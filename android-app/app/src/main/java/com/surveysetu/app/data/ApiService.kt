package com.surveysetu.app.data

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    // --- New Attendance Endpoints ---
    @Multipart
    @POST("attendance/clock-in")
    suspend fun clockIn(
        @Part("device_id") deviceId: RequestBody,
        @Part("gps_lat") gpsLat: RequestBody?,
        @Part("gps_lng") gpsLng: RequestBody?,
        @Part selfie: MultipartBody.Part?
    ): Response<Unit>

    @POST("attendance/clock-out")
    suspend fun clockOut(): Response<Unit>

    // --- Survey Endpoints ---
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
        @Part("respondent_name") name: RequestBody?,
        @Part("respondent_contact") contact: RequestBody?,
        @Part("answers") answers: RequestBody,
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
