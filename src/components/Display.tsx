type Props = {
  value: string;
};

export default function Display({ value }: Props) {
  return (
    <div className="display-panel" aria-live="polite">
      {value}
    </div>
  );
}

