import { type Request, type Response } from "express";
import * as UserService from "../services/user.service";
import jwt from "jsonwebtoken";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const validatedData = req.body;
    const newUser = await UserService.registerUser(validatedData as any);

    const secret = process.env.JWT_SECRET || "default_secret";
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET || "default_refresh_secret";

    const accessToken = jwt.sign(
      { id: newUser.id, email: newUser.email },
      secret,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = jwt.sign(
      { id: newUser.id, email: newUser.email },
      refreshSecret,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true, // 🌟
      sameSite: "none", // 🌟
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // 🌟
      sameSite: "none", // 🌟
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      status: "success",
      message: "User registered and logged in successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname,
      },
    });
  } catch (error: any) {
    if (error?.message === "EMAIL_ALREADY_EXISTS") {
      return res
        .status(400)
        .json({ status: "error", message: "Email is already registered" });
    }
    res
      .status(500)
      .json({ status: "error", message: "Could not register user" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    const result = await UserService.loginUser(email, password);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      user: result.user,
    });
  } catch (error: any) {
    if (error?.message === "INVALID_CREDENTIALS") {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid email or password" });
    }
    console.error("Login Error:", error);
    res.status(500).json({ status: "error", message: "Could not login" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as { user?: { id: string } }).user?.id;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        status: "error",
        message: "User ID is required and must be a string",
      });
    }
    const updatedUser = await UserService.updateUser(req.body, userId);
    res
      .status(200)
      .json({ status: "success", message: "User updated successfully" });
  } catch (error) {
    console.error("PATCH User Error:", error);
    res.status(400).json({ status: "error", message: "Could not update user" });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as { user?: { id: string } }).user?.id;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        status: "error",
        message: "User ID is required and must be a string",
      });
    }
    const user = await UserService.getUserProfile(userId);
    res.status(200).json({
      status: "success",
      message: "User profile fetched successfully",
      user: user,
    });
  } catch (error) {
    console.error("GET Profile Error:", error);
    res
      .status(400)
      .json({ status: "error", message: "Could not fetch profile" });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const currentRefreshToken = req.cookies.refreshToken;

    if (!currentRefreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const newAccessToken =
      await UserService.refreshAccessToken(currentRefreshToken);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error: any) {
    if (error.message === "INVALID_REFRESH_TOKEN") {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }
    console.error("Refresh Token Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
