package com.surveysetu.app.ui

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.pm.PackageManager
import android.os.Build
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.surveysetu.app.data.DatabaseProvider
import com.surveysetu.app.data.SurveyEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: SurveyViewModel = viewModel(factory = SurveyViewModelFactory()),
    onSurveySelected: (SurveyEntity) -> Unit,
    onLogout: () -> Unit,
    onPrinterStatusChanged: (String?) -> Unit
) {
    val context = LocalContext.current
    val surveyState by viewModel.surveyState.collectAsState()
    
    val session = remember { DatabaseProvider.sessionManager }
    val surveyorName = remember { session.getUserName() ?: "Unknown User" }
    val surveyorId = remember { session.getUserId() ?: "---" }

    var showPrinterDialog by remember { mutableStateOf(false) }
    var selectedPrinterName by remember { mutableStateOf<String?>(null) }

    // REAL-TIME LOCK CHECK
    LaunchedEffect(surveyState) {
        if (surveyState is SurveyState.Error && (surveyState as SurveyState.Error).message == "ACCOUNT_LOCKED") {
            onLogout()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Surveyor Dashboard") },
                actions = {
                    IconButton(onClick = { showPrinterDialog = true }) {
                        Icon(Icons.Default.Print, contentDescription = "Connect Printer", tint = if (selectedPrinterName == null) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.primary)
                    }
                    IconButton(onClick = { viewModel.syncSurveys() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sync")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = MaterialTheme.colorScheme.error)
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
                        Text(text = surveyorName, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                        Text(text = "User ID: $surveyorId", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            Text(
                text = selectedPrinterName ?: "No printer selected",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.padding(top = 8.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))
            Text(text = "Assigned Missions", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(8.dp))

            when (val state = surveyState) {
                is SurveyState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is SurveyState.Error -> {
                    if (state.message != "ACCOUNT_LOCKED") {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text(state.message, color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { viewModel.syncSurveys() }) {
                                Text("Retry Cloud Sync")
                            }
                        }
                    }
                }
                is SurveyState.Success -> {
                    LazyColumn {
                        items(state.surveys) { data ->
                            Card(
                                onClick = { onSurveySelected(data.survey) },
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                            ) {
                                ListItem(
                                    headlineContent = { Text(data.survey.title, fontWeight = FontWeight.Bold) },
                                    supportingContent = { Text("v${data.survey.version} • ${data.questions.size} Questions") },
                                    trailingContent = { Icon(Icons.Default.Refresh, contentDescription = null) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showPrinterDialog) {
        PrinterPickerDialog(
            onDismiss = { showPrinterDialog = false },
            onPrinterSelected = { 
                selectedPrinterName = it
                onPrinterStatusChanged(it)
                showPrinterDialog = false 
            }
        )
    }
}

@SuppressLint("MissingPermission")
@Composable
fun PrinterPickerDialog(onDismiss: () -> Unit, onPrinterSelected: (String) -> Unit) {
    val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    val pairedDevices: Set<BluetoothDevice> = bluetoothAdapter?.bondedDevices ?: emptySet()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Field Printer Selection") },
        text = {
            LazyColumn {
                if (pairedDevices.isEmpty()) {
                    item { Text("No paired printers found. Ensure your thermal printer is turned on and paired in phone settings.") }
                } else {
                    items(pairedDevices.toList()) { device ->
                        TextButton(
                            onClick = { onPrinterSelected(device.name ?: device.address) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(device.name ?: device.address, style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Dismiss") } }
    )
}
