package com.surveysetu.app.ui

import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.surveysetu.app.data.SurveyEntity

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    
    // State to persist survey session data across screens
    var selectedSurvey by remember { mutableStateOf<SurveyEntity?>(null) }
    var respondentName by remember { mutableStateOf("") }
    var respondentContact by remember { mutableStateOf("") }
    var surveyAnswers by remember { mutableStateOf<Map<String, String>>(emptyMap()) }

    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(onLoginSuccess = { navController.navigate("selfie") })
        }
        
        composable("selfie") {
            SelfieScreen(onSelfieCaptured = { 
                navController.navigate("dashboard") {
                    popUpTo("login") { inclusive = true }
                }
            })
        }
        
        composable("dashboard") {
            DashboardScreen(
                onSurveySelected = { survey ->
                    selectedSurvey = survey
                    navController.navigate("respondent_details")
                }
            )
        }
        
        composable("respondent_details") {
            RespondentDetailsScreen(
                surveyTitle = selectedSurvey?.title ?: "Survey",
                onContinue = { name, contact ->
                    respondentName = name
                    respondentContact = contact
                    navController.navigate("survey_questions")
                }
            )
        }
        
        composable("survey_questions") {
            SurveyScreen(
                onFinish = { answers ->
                    surveyAnswers = answers
                    navController.navigate("preview")
                }
            )
        }
        
        composable("preview") {
            // Fetch questions from Success state of ViewModel or pass from SurveyScreen
            // For simplicity, using a dummy or shared ViewModel state
            SurveyPreviewScreen(
                respondentName = respondentName,
                respondentContact = respondentContact,
                questions = emptyList(), // This needs proper data flow
                answers = surveyAnswers,
                onPrintRequested = { navController.navigate("print_settings") },
                onFinish = {
                    navController.navigate("dashboard") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
        
        composable("print_settings") {
            PrintSettingsScreen(
                onPrint = { size, font ->
                    // Handle actual print logic
                    navController.navigate("dashboard") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
    }
}
