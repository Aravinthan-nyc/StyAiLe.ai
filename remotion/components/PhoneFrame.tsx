import React from "react";

export interface PhoneFrameProps {
    children: React.ReactNode;
    scale?: number;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
    children,
    scale = 0.85,
}) => {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    width: `${100 * scale}%`,
                    height: `${100 * scale}%`,
                    backgroundColor: "#0a0a0a",
                    borderRadius: 50,
                    border: "4px solid #333",
                    overflow: "hidden",
                    boxShadow: "0 50px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)",
                    position: "relative",
                }}
            >
                {/* Status bar area */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 44,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
                        zIndex: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingTop: 10,
                    }}
                >
                    {/* Notch */}
                    <div
                        style={{
                            width: 120,
                            height: 28,
                            backgroundColor: "#000",
                            borderRadius: 20,
                        }}
                    />
                </div>

                {/* Content */}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                    }}
                >
                    {children}
                </div>

                {/* Home indicator */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 134,
                        height: 5,
                        backgroundColor: "rgba(255,255,255,0.3)",
                        borderRadius: 3,
                        zIndex: 100,
                    }}
                />
            </div>
        </div>
    );
};
