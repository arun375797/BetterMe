export default function FavoriteButton({ on, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-pressed={on}
      aria-label={on ? "Remove from favourites" : "Add to favourites"}
      className={`rounded-lg px-2 py-1 text-sm ${
        on ? "text-gold" : "text-muted hover:text-gold"
      } ${className}`}
    >
      {on ? "★ Favourite" : "☆ Favourite"}
    </button>
  );
}
