  function Button({ children }) {
    return (
      <button
        className="
        bg-white
        text-slate-950
        hover:bg-slate-200
        px-6
        py-3
        rounded-xl
        font-semibold
        transition
        duration-300
        border-4
        border-red-500"
      >
        {children}
      </button>
    );
  }

  export default Button;