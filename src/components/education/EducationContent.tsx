interface EducationContentProps {
  title: string;
  content: string;
}

export function EducationContent({ title, content }: EducationContentProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="prose prose-sm max-w-none text-gray-600">
        <p>{content}</p>
      </div>
    </div>
  );
}
