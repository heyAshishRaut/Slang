import { motion } from "framer-motion";

function Hover() {
    const cellVariants = {
        hover: {
            backgroundColor: "rgba(0, 0, 0, 0)",
            transition: { duration: 0.2 },
        },
        rest: {
            backgroundColor: "#000000",
            transition: { duration: 0.3, delay: 2 },
        },
    };

    return (
        <div
            style={{
                backgroundImage: `linear-gradient(to right, #fdeff9, #ec38bc, #7303c0, #03001e)`,
            }}
            className="w-full h-full grid grid-rows-20 grid-cols-10"
        >
            {[...Array(200)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-full h-full border border-gray-800/60"
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                    variants={cellVariants}
                />
            ))}
        </div>
    );
}

export default Hover;
