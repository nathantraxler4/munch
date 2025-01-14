import { Menu } from '../../../server/src/__generated__/types';

interface MenuDisplayProps {
    menu: Menu;
}

/**
 *
 */
export function MenuDisplay({ menu }: MenuDisplayProps) {
    return (
        <div
            className="w-full max-w-2xl aspect-[4/7] rounded-md p-4 text-white relative"
            style={{
                backgroundImage: `url(${menu.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            <div className="relative">
                {menu.courses.map((course, index) => (
                    <div
                        key={index}
                        className="relative mb-4 sm:mb-6 p-4 sm:p-6 bg-black/50 rounded-md"
                    >
                        <h3 className="text-sm sm:text-xl font-bold mb-2">{course.name}</h3>
                        <p className="text-xs sm:text-lg text-slate-200">{course.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
