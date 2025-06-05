
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Lock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Чат с API
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Современный интерфейс для взаимодействия с API через чат. 
            Отправляйте текстовые сообщения и файлы, получайте ответы в реальном времени.
          </p>
          
          <div className="space-x-4">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Начать работу
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Чат с API</h3>
            <p className="text-gray-600">
              Интуитивный интерфейс для отправки сообщений и получения ответов от API
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Управление пользователями</h3>
            <p className="text-gray-600">
              Админская панель для создания и управления учетными записями пользователей
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Безопасность</h3>
            <p className="text-gray-600">
              Аутентификация пользователей и защищенное хранение данных
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
