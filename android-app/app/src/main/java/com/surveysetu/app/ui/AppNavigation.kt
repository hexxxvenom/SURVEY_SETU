package com.surveysetu.app.ui

import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.surveysetu.app.data.DatabaseProvider
import com.surveysetu.app.data.SurveyEntity

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    
    var selectedSurvey by remember { mutableStateOf<SurveyEntity?>(null) }
    var respondentName by remember { mutableStateOf("") }
    var respondentContact by remember { mutableStateOf("") }
    var surveyAnswers by remember { mutableStateOf<Map<String, String>>(emptyMap()) }

    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(onLoginSuccess = { navController.navigate("selfie") })
        }
        
        composable("selfie") {
            SelfieScreen(onClockInSuccess = { 
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
                },
                onLogout = {
                    DatabaseProvider.sessionManager.clearSession()
                    navController.navigate("login") {
                        popUpTo(0)
                    }
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
            SurveyPreviewScreen(
                respondentName = respondentName,
                respondentContact = respondentContact,
                questions = emptyList(), // Needs fetch logic
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
                onPrint = { _, _ ->
                    navController.navigate("dashboard") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
    }
}
