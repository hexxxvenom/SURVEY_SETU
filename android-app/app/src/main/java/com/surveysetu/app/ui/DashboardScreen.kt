package com.surveysetu.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.surveysetu.app.data.SurveyEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: SurveyViewModel = viewModel(factory = SurveyViewModelFactory()),
    onSurveySelected: (SurveyEntity) -> Unit,
    onConnectPrinter: () -> Unit
) {
    val surveyState by viewModel.surveyState.collectAsState()
    
    // In a real app, these would come from SessionManager
    val surveyorName = "Rahul Sharma" 
    val surveyorId = "SRV-001"

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("SurveySetu Dashboard") },
                actions = {
                    IconButton(onClick = onConnectPrinter) {
                        Icon(Icons.Default.Print, contentDescription = "Connect Printer")
                    }
                    IconButton(onClick = { viewModel.syncSurveys() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sync")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Surveyor Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(text = surveyorName, style = MaterialTheme.typography.titleLarge)
                        Text(text = "ID: $surveyorId", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text(text = "Available Surveys", style = MaterialTheme.typography.headlineSmall)
            Spacer(modifier = Modifier.height(8.dp))

            when (val state = surveyState) {
                is SurveyState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is SurveyState.Error -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Button(onClick = { viewModel.syncSurveys() }) {
                            Text("Retry Sync")
                        }
                    }
                }
                is SurveyState.Success -> {
                    // Note: In our seed, we only have one survey, but the UI handles multiple
                    val surveys = listOf(state.survey) 
                    LazyColumn {
                        items(surveys) { survey ->
                            Card(
                                onClick = { onSurveySelected(survey) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                            ) {
                                ListItem(
                                    headlineContent = { Text(survey.title) },
                                    supportingContent = { Text("Version: ${survey.version}") },
                                    trailingContent = { Text("Start >") }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
