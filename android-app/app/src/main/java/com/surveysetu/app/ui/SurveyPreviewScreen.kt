package com.surveysetu.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SurveyPreviewScreen(
    respondentName: String,
    respondentContact: String,
    questions: List<QuestionUiModel>,
    answers: Map<String, String>,
    onPrintRequested: () -> Unit,
    onFinish: () -> Unit
) {
    Scaffold(
        topBar = { TopAppBar(title = { Text("Response Preview") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            LazyColumn(modifier = Modifier.weight(1f)) {
                item {
                    Text("Respondent: $respondentName", style = MaterialTheme.typography.titleLarge)
                    Text("Contact: $respondentContact", style = MaterialTheme.typography.bodyMedium)
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                }

                items(questions) { question ->
                    val selectedOptionId = answers[question.id]
                    val selectedOptionText = question.options.find { it.id == selectedOptionId }?.text ?: "Not Answered"
                    
                    Column(modifier = Modifier.padding(vertical = 8.dp)) {
                        Text(text = question.text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                        Text(text = selectedOptionText, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedButton(
                    onClick = onFinish,
                    modifier = Modifier.weight(1f).height(56.dp)
                ) {
                    Text("Finish Without Print")
                }
                Button(
                    onClick = onPrintRequested,
                    modifier = Modifier.weight(1f).height(56.dp)
                ) {
                    Text("Print Receipt")
                }
            }
        }
    }
}
