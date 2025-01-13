import { Menu } from '../../../server/src/__generated__/types';

interface MenuDisplayProps {
    menu: Menu;
}

export function MenuDisplay({ menu }: MenuDisplayProps) {
  return (
    <div 
      className="w-full max-w-2xl rounded-md p-6 text-white relative"
      style={{
        backgroundImage: `url(${menu.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/50 rounded-md" />
      <div className="relative">
        {menu.courses.map((course, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <h3 className="text-xl font-bold mb-2">{course.name}</h3>
            <p className="text-slate-300">{course.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}