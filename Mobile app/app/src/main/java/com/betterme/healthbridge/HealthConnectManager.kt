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
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit
import java.security.MessageDigest

private data class SleepSlice(val start: Instant, val end: Instant, val label: String)
private data class SleepEpisode(
    val records: List<SleepSessionRecord>,
    val start: Instant,
    val end: Instant,
    val startOffset: ZoneOffset?,
    val endOffset: ZoneOffset?,
    val stageMinutes: Map<String, Long>,
    val recordedSleepMinutes: Long,
    val actualSleepMinutes: Long,
)

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

    suspend fun hasHistoryPermission(): Boolean = HISTORY_PERMISSION in grantedPermissions()

    suspend fun syncHistory(
        incrementalSince: Instant?,
        onBatch: suspend (List<SyncRecord>) -> Unit,
        onProgress: (SyncProgress) -> Unit,
    ): SyncProgress {
        val granted = grantedPermissions()
        val initialDayCount = if (HISTORY_PERMISSION in granted) 40L else 30L
        val start = incrementalSince
            ?: Instant.now().atZone(ZoneId.systemDefault()).toLocalDate().minusDays(initialDayCount - 1)
                .atStartOfDay(ZoneId.systemDefault()).toInstant()
        val end = Instant.now().plus(1, ChronoUnit.MINUTES)
        val counts = linkedMapOf<String, Int>()
        var total = 0

        suspend fun accept(type: String, records: List<SyncRecord>) {
            records.chunked(50).forEach { batch ->
                if (batch.isNotEmpty()) {
                    onBatch(batch)
                    counts[type] = (counts[type] ?: 0) + batch.size
                    total += batch.size
                    onProgress(SyncProgress(total, counts.toMap()))
                }
            }
        }

        if (HealthPermission.getReadPermission(SleepSessionRecord::class) in granted) {
            accept("sleep", mergeSleepRecords(readAllSleepRecords(start, end)).map { it.toSyncRecord() })
        }
        if (HealthPermission.getReadPermission(StepsRecord::class) in granted) {
            accept("steps", aggregateDailySteps(start, end))
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
        return mergeSleepRecords(readAllSleepRecords(now.minus(7, ChronoUnit.DAYS), now.plusSeconds(1)))
            .maxByOrNull { it.end }
            ?.toSummary()
    }

    private suspend fun readAllSleepRecords(start: Instant, end: Instant): List<SleepSessionRecord> {
        val records = mutableListOf<SleepSessionRecord>()
        var pageToken: String? = null
        do {
            val response = client.readRecords(
                ReadRecordsRequest(
                    recordType = SleepSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(start, end),
                    ascendingOrder = true,
                    pageSize = 1000,
                    pageToken = pageToken,
                )
            )
            records += response.records.filter { it.metadata.dataOrigin.packageName == SAMSUNG_HEALTH_PACKAGE }
            pageToken = response.pageToken
        } while (pageToken != null)
        return records
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

    private fun mergeSleepRecords(records: List<SleepSessionRecord>): List<SleepEpisode> {
        if (records.isEmpty()) return emptyList()
        val groups = mutableListOf<MutableList<SleepSessionRecord>>()
        records.sortedBy { it.startTime }.forEach { record ->
            val current = groups.lastOrNull()
            val currentStart = current?.minOfOrNull { it.startTime }
            val currentEnd = current?.maxOfOrNull { it.endTime }
            val joins = current != null && currentStart != null && currentEnd != null &&
                record.startTime <= currentEnd.plus(3, ChronoUnit.HOURS) &&
                maxOf(currentEnd, record.endTime) <= currentStart.plus(18, ChronoUnit.HOURS)
            if (joins) current.add(record) else groups.add(mutableListOf(record))
        }
        return groups.map { buildSleepEpisode(it) }
    }

    private fun buildSleepEpisode(records: List<SleepSessionRecord>): SleepEpisode {
        val startRecord = records.minBy { it.startTime }
        val endRecord = records.maxBy { it.endTime }
        val slices = records.flatMap { record ->
            if (record.stages.isEmpty()) {
                listOf(SleepSlice(record.startTime, record.endTime, "Sleeping"))
            } else {
                record.stages.mapNotNull { stage ->
                    stageName(stage.stage)?.let { SleepSlice(stage.startTime, stage.endTime, it) }
                }
            }
        }.filter { it.end > it.start }
        val boundaries = slices.flatMap { listOf(it.start, it.end) }.distinct().sorted()
        val totalSeconds = linkedMapOf("Awake" to 0L, "Light" to 0L, "Deep" to 0L, "REM" to 0L, "Sleeping" to 0L)
        boundaries.zipWithNext().forEach { (segmentStart, segmentEnd) ->
            val labels = slices.filter { it.start < segmentEnd && it.end > segmentStart }.map { it.label }.toSet()
            val label = listOf("Awake", "Deep", "REM", "Light", "Sleeping").firstOrNull { it in labels }
            if (label != null) totalSeconds[label] = totalSeconds.getValue(label) + Duration.between(segmentStart, segmentEnd).seconds.coerceAtLeast(0)
        }
        val stageMinutes = totalSeconds.filterValues { it > 0 }.mapValues { (_, seconds) -> (seconds + 30) / 60 }
        val recorded = stageMinutes.values.sum().takeIf { it > 0 }
            ?: records.sumOf { Duration.between(it.startTime, it.endTime).toMinutes().coerceAtLeast(0) }
        val actual = stageMinutes.filterKeys { it != "Awake" }.values.sum().coerceAtMost(recorded)
        return SleepEpisode(
            records = records,
            start = startRecord.startTime,
            end = endRecord.endTime,
            startOffset = startRecord.startZoneOffset,
            endOffset = endRecord.endZoneOffset,
            stageMinutes = stageMinutes,
            recordedSleepMinutes = recorded,
            actualSleepMinutes = actual.takeIf { it > 0 } ?: recorded,
        )
    }

    private fun stageName(stage: Int): String? = when (stage) {
        SleepSessionRecord.STAGE_TYPE_AWAKE, SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED,
        SleepSessionRecord.STAGE_TYPE_OUT_OF_BED -> "Awake"
        SleepSessionRecord.STAGE_TYPE_LIGHT -> "Light"
        SleepSessionRecord.STAGE_TYPE_DEEP -> "Deep"
        SleepSessionRecord.STAGE_TYPE_REM -> "REM"
        SleepSessionRecord.STAGE_TYPE_SLEEPING -> "Sleeping"
        else -> null
    }

    private fun SleepEpisode.toSyncRecord(): SyncRecord {
        val identity = records.map { it.metadata.id }.sorted().joinToString("|")
        val digest = MessageDigest.getInstance("SHA-256").digest(identity.toByteArray())
            .take(16).joinToString("") { "%02x".format(it.toInt() and 0xff) }
        return SyncRecord(
            externalId = "hc:sleep_episode:$digest",
            type = "sleep",
            startTime = start,
            endTime = end,
            sourceApp = SAMSUNG_HEALTH_PACKAGE,
            data = mapOf(
                "startOffsetSeconds" to startOffset?.totalSeconds,
                "endOffsetSeconds" to endOffset?.totalSeconds,
                "sleepTimeMinutes" to recordedSleepMinutes,
                "actualSleepMinutes" to actualSleepMinutes,
                "elapsedMinutes" to Duration.between(start, end).toMinutes(),
                "stages" to stageMinutes,
                "fragmentCount" to records.size,
            ),
        )
    }

    private fun SleepEpisode.toSummary() = SleepSummary(
        start, end, startOffset, endOffset, stageMinutes, SAMSUNG_HEALTH_PACKAGE,
        recordedSleepMinutes, actualSleepMinutes,
    )

    private suspend fun aggregateDailySteps(start: Instant, end: Instant): List<SyncRecord> {
        val zone = ZoneId.systemDefault()
        val records = mutableListOf<SyncRecord>()
        var day = start.atZone(zone).toLocalDate()
        val finalDay = end.atZone(zone).toLocalDate()
        while (!day.isAfter(finalDay)) {
            val dayStart = day.atStartOfDay(zone).toInstant()
            val nextDayStart = day.plusDays(1).atStartOfDay(zone).toInstant()
            val bucketEnd = minOf(nextDayStart, end)
            if (dayStart < bucketEnd) {
                val aggregate = client.aggregate(
                    AggregateRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(dayStart, bucketEnd),
                    )
                )
                aggregate[StepsRecord.COUNT_TOTAL]?.let { count ->
                    records += SyncRecord(
                        externalId = "hc:steps:day:$day",
                        type = "steps",
                        startTime = dayStart,
                        endTime = bucketEnd,
                        sourceApp = "health_connect_aggregate",
                        data = mapOf(
                            "count" to count,
                            "startOffsetSeconds" to zone.rules.getOffset(dayStart).totalSeconds,
                            "aggregation" to "health_connect_daily_total",
                        ),
                    )
                }
            }
            day = day.plusDays(1)
        }
        return records
    }

    private fun HeartRateRecord.toSyncRecords() = samples.map { sample ->
        SyncRecord(
            externalId = "hc:heart_rate:${sample.time.toEpochMilli()}:${sample.beatsPerMinute}",
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
