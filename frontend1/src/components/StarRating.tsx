interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  size?: string;
}

export default function StarRating({ value = 0, onChange, size = 'text-base' }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`flex gap-0.5 ${size}`}>
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => onChange && onChange(star)}
          className={`${star <= Math.round(value) ? 'text-accent' : 'text-beige-dark'} ${
            onChange ? 'cursor-pointer' : ''
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
