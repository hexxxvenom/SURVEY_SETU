package com.surveysetu.app.data

import okhttp3.OkHttpClient
import okhttp3.Dns
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import android.util.Log
import java.net.InetAddress

object RetrofitClient {
    /**
     * MASTER PRODUCTION CONFIG:
     * We use the hostname for standard resolution, but our custom DNS 
     * will provide the hardcoded IP if the ISP (Airtel/Jio) blocks it.
     */
    private const val BASE_URL = "https://surveysetu-production.up.railway.app/"
    
    // The current resolved IP for surveysetu-production.up.railway.app
    private const val FALLBACK_IP = "69.46.46.119"

    var authToken: String? = null

    /**
     * ISP BYPASS DNS:
     * If the mobile network (Jio/Airtel) blocks the hostname, 
     * this resolver manually provides the direct cloud IP.
     */
    private val ispBypassDns = object : Dns {
        override fun lookup(hostname: String): List<InetAddress> {
            return try {
                // 1. Try standard system lookup
                val addresses = Dns.SYSTEM.lookup(hostname)
                if (addresses.isEmpty()) throw Exception("Empty DNS response")
                addresses
            } catch (e: Exception) {
                Log.e("RetrofitClient", "ISP Block Detected for $hostname. Using Hardcoded Cloud IP Fallback.")
                // 2. FORCED FALLBACK: Provide the direct IP if DNS fails
                if (hostname.contains("railway.app")) {
                    listOf(InetAddress.getByName(FALLBACK_IP))
                } else {
                    Dns.SYSTEM.lookup(hostname)
                }
            }
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .dns(ispBypassDns)
        .addInterceptor { chain ->
            val requestBuilder = chain.request().newBuilder()
            authToken?.let {
                requestBuilder.addHeader("Authorization", "Bearer $it")
            }
            
            val request = requestBuilder.build()
            try {
                chain.proceed(request)
            } catch (e: Exception) {
                Log.e("RetrofitClient", "CONNECTION ERROR: ${e.message}")
                throw e
            }
        }
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
