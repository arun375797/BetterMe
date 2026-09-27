import TimePicker12 from "./TimePicker12.jsx";

function dateValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMinutes(time, minutes) {
  const [hour, minute] = time.split(":").map(Number);
  const total = (hour * 60 + minute + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function todayScheduleDate() {
  return dateValue(0);
}

export default function TodoScheduleFields({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  compact = false,
}) {
  function clearSchedule() {
    onDateChange("");
    onStartTimeChange("");
    onEndTimeChange("");
  }

  return (
    <div className={compact ? "w-full" : ""}>
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { label: "Today", value: dateValue(0) },
          { label: "Tomorrow", value: dateValue(1) },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onDateChange(option.value)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium ring-1 transition-colors ${
              date === option.value
                ? "bg-cyan/15 text-cyan ring-cyan/35"
                : "bg-white/4 text-muted ring-line hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={clearSchedule}
          className={`rounded-lg px-3 py-1.5 text-[11px] font-medium ring-1 transition-colors ${
            !date
              ? "bg-white/10 text-ink ring-white/20"
              : "bg-white/4 text-muted ring-line hover:text-ink"
          }`}
        >
          No fixed time
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block min-w-0 sm:col-span-2">
          <span className="mb-1.5 block text-[11px] font-medium text-muted">
            Schedule date
          </span>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              const next = event.target.value;
              onDateChange(next);
              if (!next) {
                onStartTimeChange("");
                onEndTimeChange("");
              }
            }}
            className="h-[34px] w-full rounded-lg bg-white/5 px-3 text-xs text-muted ring-1 ring-line focus:outline-none focus:ring-cyan/40"
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-medium text-muted">
            Starts
          </span>
          <TimePicker12
            value={startTime}
            onChange={onStartTimeChange}
            disabled={!date}
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-[11px] font-medium text-muted">
            Ends <span className="font-normal text-muted/70">(optional)</span>
          </span>
          <TimePicker12
            value={endTime}
            onChange={onEndTimeChange}
            disabled={!date || !startTime}
          />
        </label>
      </div>

      {date && startTime ? (
        <div className="mt-3">
          <span className="mr-2 text-[11px] font-medium text-muted">Quick duration</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[15, 30, 45, 60, 90, 120].map((minutes) => {
              const value = addMinutes(startTime, minutes);
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => onEndTimeChange(value)}
                  className={`rounded-md px-2 py-1 text-[11px] ring-1 transition-colors ${
                    endTime === value
                      ? "bg-gold/15 text-gold ring-gold/30"
                      : "bg-white/4 text-muted ring-line hover:text-ink"
                  }`}
                >
                  {minutes < 60 ? `${minutes}m` : minutes === 60 ? "1h" : minutes === 90 ? "1½h" : "2h"}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {date ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted">
            {endTime && startTime && endTime <= startTime
              ? "End time will be treated as the next day."
              : "Add an end time when this task has a time block."}
          </p>
          <button
            type="button"
            onClick={clearSchedule}
            className="text-[11px] text-muted hover:text-coral"
          >
            Clear schedule
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-muted">
          Leave this empty for a task with no fixed time.
        </p>
      )}
    </div>
  );
}
