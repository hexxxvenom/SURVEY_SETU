package com.surveysetu.app.data

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import android.util.Log

object RetrofitClient {
    // FORCE FULL SCHEME: Using exact HTTPS protocol with trailing slash
    private const val BASE_URL = "https://surveysetu-production.up.railway.app/"

    var authToken: String? = null

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val requestBuilder = chain.request().newBuilder()
            authToken?.let {
                requestBuilder.addHeader("Authorization", "Bearer $it")
                Log.d("RetrofitClient", "Request with Token: Bearer ${it.take(10)}...")
            }
            val response = chain.proceed(requestBuilder.build())
            
            // SECURITY: Handle user/device locking
            if (response.code == 401 || response.code == 403) {
                authToken = null
                Log.e("RetrofitClient", "Auth Error: ${response.code}")
            }
            response
        }
        .connectTimeout(60, TimeUnit.SECONDS) // Increased for mobile networks
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    val apiService: ApiService by lazy {
        Log.i("RetrofitClient", "Initializing with URL: $BASE_URL")
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
