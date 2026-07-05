package com.surveysetu.app.ui

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.surveysetu.app.utils.PrintManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SurveyPreviewScreen(
    respondentName: String,
    respondentContact: String,
    questions: List<QuestionUiModel>,
    answers: Map<String, String>,
    printerName: String?,
    paperSizeMm: Int = 58,
    fontName: String = "Mangal",
    onFinish: () -> Unit
) {
    val context = LocalContext.current
    var isPrinting by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Mission Summary") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            LazyColumn(modifier = Modifier.weight(1f)) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Respondent: $respondentName", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text("Contact: $respondentContact", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }

                itemsIndexed(questions) { index, question ->
                    val selectedOptionId = answers[question.id]
                    val selectedOptionText = question.options.find { it.id == selectedOptionId }?.text ?: "Not Answered"
                    
                    Column(modifier = Modifier.padding(vertical = 8.dp)) {
                        Text(text = "${index + 1}. ${question.text}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        Text(text = selectedOptionText, style = MaterialTheme.typography.bodyLarge)
                        HorizontalDivider(modifier = Modifier.padding(top = 8.dp), thickness = 0.5.dp)
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Button(
                    onClick = {
                        if (printerName != null) {
                            isPrinting = true
                            val result = PrintManager.printSurveyReceipt(
                                context = context,
                                printerName = printerName,
                                surveyTitle = "Mission Record",
                                respondentName = respondentName,
                                respondentContact = respondentContact,
                                questions = questions,
                                answers = answers,
                                paperSizeMm = paperSizeMm,
                                selectedFont = fontName
                            )
                            isPrinting = false
                            if (result.isFailure) {
                                Toast.makeText(context, "Print Error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                            }
                        } else {
                            Toast.makeText(context, "Link a printer from the dashboard first", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.weight(1f).height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                    enabled = !isPrinting
                ) {
                    Text("Print Receipt")
                }
                
                Button(
                    onClick = onFinish,
                    modifier = Modifier.weight(1f).height(56.dp)
                ) {
                    Text("Finish Shift")
                }
            }
        }
    }
}
