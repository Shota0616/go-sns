import { Route, Routes } from 'react-router-dom';
import Viteinit from '/src/components/Viteinit';
import Auth from '/src/components/Auth';
import Logout from '/src/components/Logout';


const RoutesConfig = () => {
    return (
    <>
        <Routes>
            {/* vite, react初期画面 */}
            <Route path="/viteinit" element={<Viteinit />} />
            {/* auth画面 */}
            <Route path="/auth/activate" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
            {/* ダッシュボード */}
            <Route path="/logout" element={<Logout />} />
        </Routes>
    </>
    );
};

export default RoutesConfig;
