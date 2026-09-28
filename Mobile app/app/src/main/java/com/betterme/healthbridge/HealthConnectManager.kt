package com.betterme.healthbridge

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.FloorsClimbedRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit

class HealthConnectManager(private val context: Context) {
    companion object {
        const val PROVIDER_PACKAGE = "com.google.android.apps.healthdata"
        const val SAMSUNG_HEALTH_PACKAGE = "com.sec.android.app.shealth"
        val HISTORY_PERMISSION = HealthPermission.PERMISSION_READ_HEALTH_DATA_HISTORY
        val PERMISSIONS = setOf(
            HealthPermission.getReadPermission(SleepSessionRecord::class),
            HealthPermission.getReadPermission(StepsRecord::class),
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(RestingHeartRateRecord::class),
            HealthPermission.getReadPermission(OxygenSaturationRecord::class),
            HealthPermission.getReadPermission(DistanceRecord::class),
            HealthPermission.getReadPermission(FloorsClimbedRecord::class),
            HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
            HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
            HealthPermission.getReadPermission(ExerciseSessionRecord::class),
            HISTORY_PERMISSION,
        )
    }

    val sdkStatus: Int
        get() = HealthConnectClient.getSdkStatus(context, PROVIDER_PACKAGE)

    private val client: HealthConnectClient by lazy {
        HealthConnectClient.getOrCreate(context, PROVIDER_PACKAGE)
    }

    suspend fun grantedPermissions(): Set<String> = client.permissionController.getGrantedPermissions()

    suspend fun hasAnyDataPermission(): Boolean =
        grantedPermissions().any { it in PERMISSIONS && it != HISTORY_PERMISSION }

    suspend fun syncHistory(
        incrementalSince: Instant?,
        onBatch: suspend (List<SyncRecord>) -> Unit,
        onProgress: (SyncProgress) -> Unit,
    ): SyncProgress {
        val granted = grantedPermissions()
        val fullHistory = HISTORY_PERMISSION in granted
        val start = incrementalSince
            ?: if (fullHistory) Instant.EPOCH else Instant.now().minus(30, ChronoUnit.DAYS)
        val end = Instant.now().plus(1, ChronoUnit.MINUTES)
        val counts = linkedMapOf<String, Int>()
        var total = 0

        suspend fun accept(type: String, records: List<SyncRecord>) {
            records.chunked(250).forEach { batch ->
                if (batch.isNotEmpty()) onBatch(batch)
            }
            counts[type] = (counts[type] ?: 0) + records.size
            total += records.size
            onProgress(SyncProgress(total, counts.toMap()))
        }

        if (HealthPermission.getReadPermission(SleepSessionRecord::class) in granted) {
            readPaged<SleepSessionRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("sleep", it) }
        }
        if (HealthPermission.getReadPermission(StepsRecord::class) in granted) {
            readPaged<StepsRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("steps", it) }
        }
        if (HealthPermission.getReadPermission(HeartRateRecord::class) in granted) {
            readPaged<HeartRateRecord>(start, end, { it.toSyncRecords() }) { accept("heart rate", it) }
        }
        if (HealthPermission.getReadPermission(RestingHeartRateRecord::class) in granted) {
            readPaged<RestingHeartRateRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("resting heart rate", it) }
        }
        if (HealthPermission.getReadPermission(OxygenSaturationRecord::class) in granted) {
            readPaged<OxygenSaturationRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("oxygen", it) }
        }
        if (HealthPermission.getReadPermission(DistanceRecord::class) in granted) {
            readPaged<DistanceRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("distance", it) }
        }
        if (HealthPermission.getReadPermission(FloorsClimbedRecord::class) in granted) {
            readPaged<FloorsClimbedRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("floors", it) }
        }
        if (HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class) in granted) {
            readPaged<ActiveCaloriesBurnedRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("active calories", it) }
        }
        if (HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class) in granted) {
            readPaged<TotalCaloriesBurnedRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("total calories", it) }
        }
        if (HealthPermission.getReadPermission(ExerciseSessionRecord::class) in granted) {
            readPaged<ExerciseSessionRecord>(start, end, { listOf(it.toSyncRecord()) }) { accept("workouts", it) }
        }
        return SyncProgress(total, counts)
    }

    suspend fun latestSleep(): SleepSummary? {
        val now = Instant.now()
        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = SleepSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(now.minus(7, ChronoUnit.DAYS), now.plusSeconds(1)),
                ascendingOrder = false,
                pageSize = 100,
            )
        )
        return response.records.maxByOrNull { it.endTime }?.toSummary()
    }

    private suspend inline fun <reified T : Record> readPaged(
        start: Instant,
        end: Instant,
        crossinline transform: (T) -> List<SyncRecord>,
        crossinline onPage: suspend (List<SyncRecord>) -> Unit,
    ) {
        var pageToken: String? = null
        do {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = T::class,
                    timeRangeFilter = TimeRangeFilter.between(start, end),
                    ascendingOrder = true,
                    pageSize = 1000,
                    pageToken = pageToken,
                )
            )
            onPage(response.records.flatMap(transform).filter { it.sourceApp == SAMSUNG_HEALTH_PACKAGE })
            pageToken = response.pageToken
        } while (pageToken != null)
    }

    private fun base(record: Record, type: String, start: Instant, end: Instant, data: Map<String, Any?>) = SyncRecord(
        externalId = "hc:$type:${record.metadata.id}",
        type = type,
        startTime = start,
        endTime = end,
        sourceApp = record.metadata.dataOrigin.packageName,
        data = data,
    )

    private fun SleepSessionRecord.toSyncRecord(): SyncRecord {
        val summary = toSummary()
        return base(this, "sleep", startTime, endTime, mapOf(
            "startOffsetSeconds" to startZoneOffset?.totalSeconds,
            "endOffsetSeconds" to endZoneOffset?.totalSeconds,
            "stages" to summary.stageMinutes,
            "title" to title,
        ))
    }

    private fun SleepSessionRecord.toSummary(): SleepSummary {
        val stagesByName = linkedMapOf("Awake" to 0L, "Light" to 0L, "Deep" to 0L, "REM" to 0L, "Sleeping" to 0L)
        stages.forEach { stage ->
            val name = when (stage.stage) {
                SleepSessionRecord.STAGE_TYPE_AWAKE, SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED,
                SleepSessionRecord.STAGE_TYPE_OUT_OF_BED -> "Awake"
                SleepSessionRecord.STAGE_TYPE_LIGHT -> "Light"
                SleepSessionRecord.STAGE_TYPE_DEEP -> "Deep"
                SleepSessionRecord.STAGE_TYPE_REM -> "REM"
                SleepSessionRecord.STAGE_TYPE_SLEEPING -> "Sleeping"
                else -> return@forEach
            }
            stagesByName[name] = stagesByName.getValue(name) + Duration.between(stage.startTime, stage.endTime).toMinutes().coerceAtLeast(0)
        }
        return SleepSummary(startTime, endTime, startZoneOffset, endZoneOffset, stagesByName.filterValues { it > 0 }, metadata.dataOrigin.packageName)
    }

    private fun StepsRecord.toSyncRecord() = base(this, "steps", startTime, endTime, mapOf("count" to count, "startOffsetSeconds" to startZoneOffset?.totalSeconds))

    private fun HeartRateRecord.toSyncRecords() = samples.map { sample ->
        SyncRecord(
            externalId = "hc:heart_rate:${metadata.id}:${sample.time.toEpochMilli()}:${sample.beatsPerMinute}",
            type = "heart_rate", startTime = sample.time, endTime = sample.time,
            sourceApp = metadata.dataOrigin.packageName,
            data = mapOf("bpm" to sample.beatsPerMinute, "zoneOffsetSeconds" to startZoneOffset?.totalSeconds),
        )
    }

    private fun RestingHeartRateRecord.toSyncRecord() = base(this, "resting_heart_rate", time, time, mapOf("bpm" to beatsPerMinute, "zoneOffsetSeconds" to zoneOffset?.totalSeconds))
    private fun OxygenSaturationRecord.toSyncRecord() = base(this, "oxygen", time, time, mapOf("percentage" to percentage.value, "zoneOffsetSeconds" to zoneOffset?.totalSeconds))
    private fun DistanceRecord.toSyncRecord() = base(this, "distance", startTime, endTime, mapOf("meters" to distance.inMeters, "startOffsetSeconds" to startZoneOffset?.totalSeconds))
    private fun FloorsClimbedRecord.toSyncRecord() = base(this, "floors", startTime, endTime, mapOf("floors" to floors, "startOffsetSeconds" to startZoneOffset?.totalSeconds))
    private fun ActiveCaloriesBurnedRecord.toSyncRecord() = base(this, "active_calories", startTime, endTime, mapOf("kilocalories" to energy.inKilocalories, "startOffsetSeconds" to startZoneOffset?.totalSeconds))
    private fun TotalCaloriesBurnedRecord.toSyncRecord() = base(this, "total_calories", startTime, endTime, mapOf("kilocalories" to energy.inKilocalories, "startOffsetSeconds" to startZoneOffset?.totalSeconds))
    private fun ExerciseSessionRecord.toSyncRecord() = base(this, "exercise", startTime, endTime, mapOf("type" to exerciseName(exerciseType), "title" to title, "notes" to notes, "startOffsetSeconds" to startZoneOffset?.totalSeconds))

    private fun exerciseName(type: Int): String = when (type) {
        ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> "Walking"
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING -> "Running"
        ExerciseSessionRecord.EXERCISE_TYPE_BIKING -> "Cycling"
        ExerciseSessionRecord.EXERCISE_TYPE_BADMINTON -> "Badminton"
        ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING, ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING -> "Strength training"
        ExerciseSessionRecord.EXERCISE_TYPE_YOGA -> "Yoga"
        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL, ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> "Swimming"
        else -> "Workout"
    }
}
