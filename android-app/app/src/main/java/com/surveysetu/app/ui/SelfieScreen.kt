package com.surveysetu.app.ui

import android.net.Uri
import android.provider.Settings
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun SelfieScreen(
    onClockInSuccess: () -> Unit,
    viewModel: SurveyViewModel = viewModel(factory = SurveyViewModelFactory())
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    
    var imageCapture: ImageCapture? by remember { mutableStateOf(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isVerifying by remember { mutableStateOf(false) }

    val hardwareId = remember { 
        Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "UNKNOWN"
    }
    
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Attendance Check-In",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(16.dp)
        )
        Text(
            text = "Capture a selfie to verify your identity and start your field shift",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )

        if (isVerifying) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp))
        }

        errorMessage?.let {
            Text(text = it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(16.dp))
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    val executor = ContextCompat.getMainExecutor(ctx)
                    cameraProviderFuture.addListener({
                        try {
                            val cameraProvider = cameraProviderFuture.get()
                            val preview = Preview.Builder().build().also {
                                it.setSurfaceProvider(previewView.surfaceProvider)
                            }
                            imageCapture = ImageCapture.Builder()
                                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                                .build()
                            cameraProvider.unbindAll()
                            cameraProvider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_FRONT_CAMERA, preview, imageCapture)
                        } catch (ex: Exception) {
                            errorMessage = "Camera Error: ${ex.message}"
                        }
                    }, executor)
                    previewView
                },
                modifier = Modifier.fillMaxSize()
            )
        }

        Button(
            onClick = {
                val capture = imageCapture ?: return@Button
                isVerifying = true
                errorMessage = null

                val photoFile = File(context.cacheDir, "clock_in_${System.currentTimeMillis()}.jpg")
                val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

                capture.takePicture(
                    outputOptions,
                    ContextCompat.getMainExecutor(context),
                    object : ImageCapture.OnImageSavedCallback {
                        override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                            scope.launch {
                                // Trigger real-time attendance clock-in on the cloud
                                val result = viewModel.repository.clockIn(hardwareId, null, null, photoFile)
                                if (result.isSuccess) {
                                    onClockInSuccess()
                                } else {
                                    isVerifying = false
                                    errorMessage = "Clock-in Failed: ${result.exceptionOrNull()?.message}"
                                }
                            }
                        }
                        override fun onError(exc: ImageCaptureException) {
                            isVerifying = false
                            errorMessage = "Capture Failed: ${exc.message}"
                        }
                    }
                )
            },
            modifier = Modifier.padding(32.dp).fillMaxWidth().height(56.dp),
            enabled = !isVerifying
        ) {
            if (isVerifying) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Verifying Identity...")
            } else {
                Text("Verify & Start Shift")
            }
        }
    }
}
