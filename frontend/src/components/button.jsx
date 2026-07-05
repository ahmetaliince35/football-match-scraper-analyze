  function Button({ children }) {
    return (
      <button
        className="
        bg-blue-00
        hover:bg-blue-500
        px-6
        py-3
        rounded-xl
        font-semibold
        transition
        duration-300"
      >
        {children}
      </button>
    );
  }

  export default Button;