import Navbar from "@/app/components/Navbar";
import PlaylistForm from "@/app/components/PlaylistForm"; // PlaylistForm component
import { CloudLightning } from "lucide-react";
const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="flex-grow max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Eye of Agomoto
        </h1>
        <PlaylistForm />
      </div>

      {/* Footer */}
      <footer className=" bg-red-200 dark:bg-gray-900 text-gray-600 dark:text-white py-4 text-center">
        <a
          href="https://github.com/Aymaan-Shabbir"
          className="flex items-center justify-center space-x-2"
        >
          <p className="text-sm">Made with</p>
          <CloudLightning
            className="text-gray-600 dark:text-white "
            size={24}
          />
          <p className="text-sm">by Aymaan Shabbir</p>
        </a>
      </footer>
    </div>
  );
};

export default Home;
