import { Menu } from 'generated-graphql';

interface MenuDisplayProps {
    menu: Menu;
}

export function MenuDisplay({ menu }: MenuDisplayProps) {
    return (
        <div
            className={`w-full max-w-5xl aspect-square rounded-md p-4 text-white relative ${
                !menu.backgroundImage
                    ? 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-gradient bg-[length:200%_100%]'
                    : ''
            }`}
            style={{
                ...(menu.backgroundImage && {
                    backgroundImage: `url(${menu.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                })
            }}
        >
            <div className="flex flex-col justify-center h-full">
                {menu.courses.map((course, index) => (
                    <div
                        key={index}
                        className="relative mb-4 sm:mb-6 p-4 sm:p-6 bg-black/50 rounded-md"
                    >
                        <h3 className="text-sm sm:text-xl font-bold mb-2">
                            <a
                                href={course.url}
                                className="text-inherit hover:underline"
                                target="_blank" // Opens the link in a new tab
                                rel="noopener noreferrer" // Ensures security for external links
                            >
                                {course.name}
                            </a>
                        </h3>

                        <p className="text-xs sm:text-lg text-slate-200">{course.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
