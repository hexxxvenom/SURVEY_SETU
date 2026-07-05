package com.surveysetu.app.ui

import androidx.compose.foundation.background
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
    var languageMode by remember { mutableStateOf("English") } // RESTORED OPTION
    var fontSize by remember { mutableIntStateOf(currentFontSize) }
    
    val hindiFonts = listOf("Mangal", "KrutiDev", "Kokila", "Utsaah", "Aparajita")
    val englishFonts = listOf("Roboto", "Montserrat", "OpenSans", "Lato", "Playfair")

    // Dynamic Font List based on restored Manual selection
    val availableFonts = if (languageMode == "Hindi" || languageMode == "Bilingual") hindiFonts else englishFonts
    
    var selectedFont by remember { 
        mutableStateOf(if (availableFonts.contains(currentFontName)) currentFontName else availableFonts.first()) 
    }

    // Force font update when manual language mode changes
    LaunchedEffect(languageMode) {
        selectedFont = availableFonts.first()
    }

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
                // 1. LANGUAGE SELECTION (RESTORED)
                item {
                    Text("1. Manual Language Selection", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    Row(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf("English", "Hindi", "Bilingual").forEach { mode ->
                            FilterChip(
                                selected = languageMode == mode,
                                onClick = { languageMode = mode },
                                label = { Text(mode) },
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), thickness = 0.5.dp)
                }

                // 2. Paper Width
                item {
                    Text("2. Select Roll Width", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf(58 to "2\"", 80 to "3\"", 112 to "4\"").forEach { (valSize, label) ->
                            FilterChip(
                                selected = paperSize == valSize, 
                                onClick = { paperSize = valSize }, 
                                label = { Text("$label ($valSize mm)") }, 
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), thickness = 0.5.dp)
                }

                // 3. Premium Fonts
                item {
                    Text("3. Premium Typefaces", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp), maxItemsInEachRow = 3) {
                        availableFonts.forEach { font ->
                            FilterChip(
                                selected = selectedFont == font,
                                onClick = { selectedFont = font },
                                label = { Text(font) },
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), thickness = 0.5.dp)
                }

                // 4. Font Size (MASSIVE SCALES)
                item {
                    Text("4. Absolute Text Scale", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf(24, 32, 48, 64, 80).forEach { size ->
                            val label = when(size) { 
                                24 -> "Regular"; 32 -> "Large"; 48 -> "XL"; 64 -> "XXL"; else -> "GIANT" 
                            }
                            FilterChip(
                                selected = fontSize == size,
                                onClick = { fontSize = size },
                                label = { Text(label) },
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                }

                // 5. POWER PREVIEW
                item {
                    Spacer(modifier = Modifier.height(32.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(20.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("FORCE-MAX PREVIEW", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                            Spacer(modifier = Modifier.height(16.dp))
                            val titleText = if (languageMode != "English") "मिशन रिकॉर्ड" else "MISSION RECORD"
                            Text(titleText, fontSize = (fontSize/1.2).sp, fontWeight = FontWeight.Black, color = Color.Black)
                            Text("==========================", color = Color.Gray)
                            Text("NAME: RAJESH KUMAR", fontSize = (fontSize/1.8).sp, fontWeight = FontWeight.Bold, color = Color.Black)
                            val qText = if (languageMode != "English") "1. आपका व्यवसाय?" else "1. Occupation?"
                            Text(qText, fontSize = (fontSize/2).sp, color = Color.Black)
                        }
                    }
                }
            }

            Button(
                onClick = { onPrint(paperSize, selectedFont, fontSize) },
                modifier = Modifier.fillMaxWidth().height(64.dp).padding(top = 16.dp),
                shape = MaterialTheme.shapes.large,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("SAVE & EXECUTE POWER PRINT", fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            }
        }
    }
}
