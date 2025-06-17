
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <span className="text-3xl text-white font-bold">AI</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            AI Чат-Ассистент
          </h1>
          <p className="text-gray-600 mb-8">
            Общайтесь с современными AI моделями в удобном интерфейсе
          </p>
        </div>
        
        <Link to="/auth">
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
            Начать общение с ИИ
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
