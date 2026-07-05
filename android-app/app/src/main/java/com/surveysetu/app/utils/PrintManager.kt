package com.surveysetu.app.utils

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.graphics.*
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import com.dantsu.escposprinter.EscPosPrinter
import com.dantsu.escposprinter.connection.bluetooth.BluetoothPrintersConnections
import com.dantsu.escposprinter.textparser.PrinterTextParserImg
import com.surveysetu.app.ui.QuestionUiModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object PrintManager {

    /**
     * ULTIMATE THERMAL ENGINE V6 (PIXEL-PERFECT):
     * Solves the "Shrinking Text" crisis by using NATIVE PRINTER PIXELS (1:1 Mapping).
     * We no longer use large Android Spacing; we use physical printer dots.
     */
    @SuppressLint("MissingPermission")
    suspend fun printSurveyReceipt(
        printerName: String,
        surveyTitle: String,
        respondentName: String,
        respondentContact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        paperSizeMm: Int = 58,
        selectedFont: String = "Roboto",
        fontSize: Int = 24
    ): Result<Unit> = withContext(Dispatchers.IO) {
        return@withContext try {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
            val pairedDevices = bluetoothAdapter?.bondedDevices ?: emptySet()
            val device = pairedDevices.find { it.name == printerName || it.address == printerName }
                ?: return@withContext Result.failure(Exception("Printer not found"))

            val connection = BluetoothPrintersConnections().getList()?.find { it.getDevice().address == device.address }
                ?: return@withContext Result.failure(Exception("Connection failed"))

            // NATIVE PIXEL LOCK:
            // 58mm = Exactly 384 dots
            // 80mm = Exactly 576 dots
            // 112mm = Exactly 832 dots
            val nativeWidthDots = when (paperSizeMm) {
                112 -> 832
                80 -> 576
                else -> 384
            }

            val printer = EscPosPrinter(connection, 203, paperSizeMm.toFloat(), 32)
            
            // RENDERING AT NATIVE RESOLUTION:
            // This prevents the printer from scaling the image down!
            val bitmap = generateNativeBitmap(
                title = surveyTitle, 
                name = respondentName, 
                contact = respondentContact, 
                questions = questions, 
                answers = answers, 
                widthDots = nativeWidthDots,
                fontName = selectedFont,
                fontSize = fontSize.toFloat() // We use the UI size directly as dots
            )

            // Center print with NO scaling
            printer.printFormattedText(
                "<img>" + PrinterTextParserImg.bitmapToHexadecimalString(printer, bitmap) + "</img>\n\n\n"
            )

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun generateNativeBitmap(
        title: String,
        name: String,
        contact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        widthDots: Int,
        fontName: String,
        fontSize: Float
    ): Bitmap {
        val paint = TextPaint().apply {
            color = Color.BLACK
            textSize = fontSize // Direct pixel mapping
            isAntiAlias = false // Crisp dots for thermal heads
            typeface = Typeface.create(fontName, Typeface.BOLD)
            style = Paint.Style.FILL
        }

        val content = StringBuilder()
        content.append("$title\n")
        content.append("========================\n")
        content.append("NAME: $name\n")
        content.append("MOB: $contact\n")
        content.append("========================\n\n")
        
        questions.forEachIndexed { i, q ->
            val ans = q.options.find { it.id == answers[q.id] }?.text ?: "N/A"
            content.append("${i + 1}. ${q.text}\n")
            content.append("ANS: $ans\n\n")
        }

        val staticLayout = StaticLayout.Builder.obtain(content.toString(), 0, content.length, paint, widthDots)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.0f)
            .build()

        val bitmap = Bitmap.createBitmap(widthDots, staticLayout.height + 20, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        staticLayout.draw(canvas)

        return bitmap
    }
}
