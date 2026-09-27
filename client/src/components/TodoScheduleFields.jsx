import TimePicker12 from "./TimePicker12.jsx";

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
