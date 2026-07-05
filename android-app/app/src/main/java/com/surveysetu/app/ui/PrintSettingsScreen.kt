package com.surveysetu.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun PrintSettingsScreen(
    currentPaperSize: Int,
    currentFontName: String,
    currentFontSize: Int,
    onPrint: (Int, String, Int) -> Unit
) {
    var paperSize by remember { mutableIntStateOf(currentPaperSize) }
    var languageMode by remember { mutableStateOf("English") }
    var fontSize by remember { mutableIntStateOf(currentFontSize) }
    
    val hindiFonts = listOf("Mangal", "KrutiDev", "Kokila", "Utsaah", "Aparajita")
    val englishFonts = listOf("Roboto", "Montserrat", "OpenSans", "Lato", "Playfair")

    val availableFonts = if (languageMode == "Hindi" || languageMode == "Bilingual") hindiFonts else englishFonts
    var selectedFont by remember { 
        mutableStateOf(if (availableFonts.contains(currentFontName)) currentFontName else availableFonts.first()) 
    }

    LaunchedEffect(languageMode) { selectedFont = availableFonts.first() }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Physical Dot Control") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
        ) {
            LazyColumn(modifier = Modifier.weight(1f)) {
                item {
                    Text("1. Language Selection", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    Row(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf("English", "Hindi", "Bilingual").forEach { mode ->
                            FilterChip(selected = languageMode == mode, onClick = { languageMode = mode }, label = { Text(mode) }, modifier = Modifier.padding(end = 8.dp))
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                }

                item {
                    Text("2. Printer Model (Paper Width)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf(58 to "Small (2\")", 80 to "Medium (3\")", 112 to "Large (4\")").forEach { (valSize, label) ->
                            FilterChip(selected = paperSize == valSize, onClick = { paperSize = valSize }, label = { Text(label) }, modifier = Modifier.padding(end = 8.dp))
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                }

                item {
                    Text("3. Font Style", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        availableFonts.forEach { font ->
                            FilterChip(selected = selectedFont == font, onClick = { selectedFont = font }, label = { Text(font) }, modifier = Modifier.padding(end = 8.dp))
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                }

                item {
                    Text("4. Physical Text Height (Dots)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        // Using Native Dot values for precise control
                        listOf(30, 50, 80, 100, 150).forEach { size ->
                            val label = when(size) { 30 -> "3mm"; 50 -> "5mm"; 80 -> "8mm"; 100 -> "10mm"; else -> "15mm" }
                            FilterChip(selected = fontSize == size, onClick = { fontSize = size }, label = { Text(label) }, modifier = Modifier.padding(end = 8.dp))
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(32.dp))
                    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Column(modifier = Modifier.padding(20.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("1:1 DOT PREVIEW", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                            val previewScale = if (fontSize > 100) 0.5f else 1.0f
                            Text("MISSION RECORD", fontSize = (fontSize * previewScale / 2.5).sp, fontWeight = FontWeight.Black, color = Color.Black)
                            Text("Height: $fontSize Physical Dots", fontSize = 10.sp, color = Color.Gray)
                        }
                    }
                }
            }

            Button(
                onClick = { onPrint(paperSize, selectedFont, fontSize) },
                modifier = Modifier.fillMaxWidth().height(64.dp).padding(top = 16.dp),
                shape = MaterialTheme.shapes.large
            ) {
                Text("LOCK SETTINGS & PRINT", fontWeight = FontWeight.Black)
            }
        }
    }
}
