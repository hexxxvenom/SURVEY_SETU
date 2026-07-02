package com.surveysetu.app.printer

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import java.io.OutputStream
import java.util.UUID

class ThermalPrinterHelper(private val deviceAddress: String) {

    private val UUID_SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private var socket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null

    fun connect(): Boolean {
        return try {
            val adapter = BluetoothAdapter.getDefaultAdapter()
            val device: BluetoothDevice = adapter.getRemoteDevice(deviceAddress)
            socket = device.createRfcommSocketToServiceRecord(UUID_SPP)
            socket?.connect()
            outputStream = socket?.outputStream
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun printReceipt(content: String, printSize: Int = 58) {
        try {
            if (outputStream == null) connect()
            
            // ESC/POS Init command
            outputStream?.write(byteArrayOf(0x1B, 0x40)) 
            
            // Bold text command
            outputStream?.write(byteArrayOf(0x1B, 0x45, 0x01))
            outputStream?.write("SurveySetu Receipt\n".toByteArray())
            outputStream?.write(byteArrayOf(0x1B, 0x45, 0x00)) // Bold off
            
            outputStream?.write(content.toByteArray())
            outputStream?.write("\n\n\n".toByteArray())
            outputStream?.flush()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun disconnect() {
        try {
            outputStream?.close()
            socket?.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
