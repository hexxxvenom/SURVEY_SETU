package com.surveysetu.app.ui

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("selfie")
                }
            )
        }
        composable("selfie") {
            SelfieScreen(
                onSelfieCaptured = { uri ->
                    navController.navigate("survey") {
                        popUpTo("selfie") { inclusive = true }
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("survey") {
            SurveyScreen(
                onFinish = {
                    // Return to start or show success
                    navController.navigate("login") {
                        popUpTo(0) // Clear backstack
                    }
                }
            )
        }
    }
}
