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
    var surveyQuestions by remember { mutableStateOf<List<QuestionUiModel>>(emptyList()) }
    var connectedPrinterName by remember { mutableStateOf<String?>(null) }
    
    // Global Print State
    var paperSize by remember { mutableIntStateOf(58) }
    var selectedFontName by remember { mutableStateOf("Roboto") }
    var languageMode by remember { mutableStateOf("English") }
    var fontSize by remember { mutableIntStateOf(24) }

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
                },
                onPrinterStatusChanged = { connectedPrinterName = it }
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
            val surveyId = selectedSurvey?.id ?: ""
            SurveyScreen(
                surveyId = surveyId,
                onFinish = { answers, questions ->
                    surveyAnswers = answers
                    surveyQuestions = questions
                    navController.navigate("preview")
                }
            )
        }
        
        composable("preview") {
            SurveyPreviewScreen(
                respondentName = respondentName,
                respondentContact = respondentContact,
                questions = surveyQuestions, 
                answers = surveyAnswers,
                printerName = connectedPrinterName,
                paperSizeMm = paperSize,
                fontName = selectedFontName,
                fontSize = fontSize,
                onConfigurePrint = {
                    navController.navigate("print_wizard")
                },
                onFinish = {
                    navController.navigate("dashboard") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }

        composable("print_wizard") {
            PrintSettingsScreen(
                onPrint = { size, font, mode, scale ->
                    paperSize = size
                    selectedFontName = font
                    languageMode = mode
                    fontSize = scale
                    navController.popBackStack()
                }
            )
        }
    }
}
