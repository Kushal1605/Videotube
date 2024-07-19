const asyncHandler = (requestHandler) => async (err, req, res, next) => {
  try {
    await requestHandler(req, res, next);
  } catch (error) {
    res.status(error.status || 500).json({
      success: "false",
      message: error.message,
    });
  }
};

export default asyncHandler;
