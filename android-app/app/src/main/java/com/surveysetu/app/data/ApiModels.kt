package com.surveysetu.app.data

import com.google.gson.annotations.SerializedName

// --- Authentication ---

data class LoginRequest(
    val username: String,
    val password: String,
    @SerializedName("device_identifier") val deviceIdentifier: String
)

data class LoginResponse(
    val token: String,
    val role: String,
    val name: String,
    val username: String
)

// --- Survey Fetching ---

data class SurveyResponse(
    val id: String,
    val title: String,
    val version: Int,
    val language: String,
    val questions: List<QuestionResponse>
)

data class QuestionResponse(
    val id: String,
    @SerializedName("question_text") val questionText: String,
    @SerializedName("order_index") val orderIndex: Int,
    @SerializedName("option_count") val optionCount: Int,
    @SerializedName("is_mandatory") val isMandatory: Boolean,
    val options: List<OptionResponse>
)

data class OptionResponse(
    val id: String,
    @SerializedName("option_text") val optionText: String,
    @SerializedName("order_index") val orderIndex: Int
)

// --- Response Submission ---

data class AnswerRequest(
    @SerializedName("question_id") val questionId: String,
    @SerializedName("selected_option_id") val selectedOptionId: String
)

data class ErrorResponse(
    val error: String
)
