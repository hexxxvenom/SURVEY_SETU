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
    var languageMode by remember { mutableStateOf("English") } // RESTORED
    var fontSize by remember { mutableIntStateOf(currentFontSize) }
    
    val hindiFonts = listOf("Mangal", "KrutiDev", "Kokila", "Utsaah", "Aparajita")
    val englishFonts = listOf("Roboto", "Montserrat", "OpenSans", "Lato", "Playfair")

    val availableFonts = if (languageMode != "English") hindiFonts else englishFonts
    var selectedFont by remember { 
        mutableStateOf(if (availableFonts.contains(currentFontName)) currentFontName else availableFonts.first()) 
    }

    LaunchedEffect(languageMode) { selectedFont = availableFonts.first() }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Power Print Control") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
        ) {
            LazyColumn(modifier = Modifier.weight(1f)) {
                // 1. Language Toggle
                item {
                    Text("1. Select Font Category", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    Row(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf("English", "Hindi", "Bilingual").forEach { mode ->
                            FilterChip(selected = languageMode == mode, onClick = { languageMode = mode }, label = { Text(mode) }, modifier = Modifier.padding(end = 8.dp))
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                }

                // 2. Paper Roll
                item {
                    Text("2. Physical Paper Width", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf(58 to "2\" (384px)", 80 to "3\" (576px)", 112 to "4\" (832px)").forEach { (valSize, label) ->
                            FilterChip(selected = paperSize == valSize, onClick = { paperSize = valSize }, label = { Text(label) }, modifier = Modifier.padding(end = 8.dp))
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                }

                // 3. Fonts
                item {
                    Text("3. Choose Premium Typeface", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        availableFonts.forEach { font ->
                            FilterChip(selected = selectedFont == font, onClick = { selectedFont = font }, label = { Text(font) }, modifier = Modifier.padding(end = 8.dp))
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                }

                // 4. POWER SIZES
                item {
                    Text("4. Absolute Print Scale", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        // Using higher physical pixel heights
                        listOf(30, 50, 70, 90, 120).forEach { size ->
                            val label = when(size) { 30 -> "Normal"; 50 -> "Large"; 70 -> "XL"; 90 -> "Jumbo"; else -> "GIANT" }
                            FilterChip(selected = fontSize == size, onClick = { fontSize = size }, label = { Text(label) }, modifier = Modifier.padding(end = 8.dp))
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(24.dp))
                    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Column(modifier = Modifier.padding(20.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("WYSIWYG DOT PREVIEW", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                            val title = if (languageMode != "English") "राष्ट्रीय मिशन" else "NATIONAL MISSION"
                            Text(title, fontSize = (fontSize/1.5).sp, fontWeight = FontWeight.Black, color = Color.Black)
                            Text("Scale: $fontSize physical dots", fontSize = 10.sp, color = Color.Gray)
                        }
                    }
                }
            }

            Button(
                onClick = { onPrint(paperSize, selectedFont, fontSize) },
                modifier = Modifier.fillMaxWidth().height(64.dp).padding(top = 16.dp),
                shape = MaterialTheme.shapes.large
            ) {
                Text("LOCK SETTINGS & EXECUTE PRINT", fontWeight = FontWeight.Black)
            }
        }
    }
}
