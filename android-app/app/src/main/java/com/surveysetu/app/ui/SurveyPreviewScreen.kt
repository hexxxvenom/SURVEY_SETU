package com.surveysetu.app.ui

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.surveysetu.app.utils.PrintManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SurveyPreviewScreen(
    respondentName: String,
    respondentContact: String,
    questions: List<QuestionUiModel>,
    answers: Map<String, String>,
    printerName: String?,
    paperSizeMm: Int = 58,
    fontName: String = "Roboto",
    fontSize: Int = 24,
    onConfigurePrint: () -> Unit,
    onFinish: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isPrinting by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { 
            TopAppBar(
                title = { Text("Final Submission") },
                actions = {
                    IconButton(onClick = onConfigurePrint) {
                        Icon(Icons.Default.Settings, contentDescription = "Print Settings")
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
            LazyColumn(modifier = Modifier.weight(1f)) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Respondent: $respondentName", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text("Contact: $respondentContact", style = MaterialTheme.typography.bodySmall)
                            Text("Print Mode: $fontName • ${paperSizeMm}mm", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
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
                            scope.launch {
                                // ASYNC PRINT: Prevents UI Glitch
                                val result = PrintManager.printSurveyReceipt(
                                    printerName = printerName,
                                    surveyTitle = "SURVEYSETU RECORD",
                                    respondentName = respondentName,
                                    respondentContact = respondentContact,
                                    questions = questions,
                                    answers = answers,
                                    paperSizeMm = paperSizeMm,
                                    selectedFont = fontName,
                                    fontSize = fontSize
                                )
                                isPrinting = false
                                if (result.isFailure) {
                                    Toast.makeText(context, "Print Error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                                } else {
                                    Toast.makeText(context, "Receipt Sent Successfully!", Toast.LENGTH_SHORT).show()
                                }
                            }
                        } else {
                            Toast.makeText(context, "Please connect a printer from Dashboard", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.weight(1f).height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                    enabled = !isPrinting
                ) {
                    if (isPrinting) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                    else Text("Print Receipt")
                }
                
                Button(
                    onClick = onFinish,
                    modifier = Modifier.weight(1f).height(56.dp)
                ) {
                    Text("Complete mission")
                }
            }
        }
    }
}
