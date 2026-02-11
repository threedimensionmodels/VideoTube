import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

/**
 * GET ALL VIDEOS (with search, sort, pagination)
 */
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query

    const match = { isPublished: true }

    if (query) {
        match.title = { $regex: query, $options: "i" }
    }

    if (userId && isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId)
    }

    const sort = {
        [sortBy]: sortType === "asc" ? 1 : -1
    }

    const pipeline = [
        { $match: match },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$owner" },
        { $sort: sort }
    ]

    const aggregate = Video.aggregate(pipeline)

    const options = {
        page: Number(page),
        limit: Number(limit)
    }

    const result = await Video.aggregatePaginate(aggregate, options)

    res.status(200).json(
        new ApiResponse(200, result, "Videos fetched successfully")
    )
})

/**
 * PUBLISH A VIDEO
 */
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile || !thumbnail) {
        throw new ApiError(500, "Error uploading files to Cloudinary")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        owner: req.user._id
    })

    res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    )
})

/**
 * GET VIDEO BY ID
 */
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
        .populate("owner", "username fullName avatar")

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

/**
 * UPDATE VIDEO
 */
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video")
    }

    if (req.file?.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path)
        if (!thumbnail) {
            throw new ApiError(500, "Thumbnail upload failed")
        }
        video.thumbnail = thumbnail.url
    }

    if (title) video.title = title
    if (description) video.description = description

    await video.save()

    res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})

/**
 * DELETE VIDEO
 */
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video")
    }

    await video.deleteOne()

    res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

/**
 * TOGGLE PUBLISH STATUS
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify this video")
    }

    video.isPublished = !video.isPublished
    await video.save()

    res.status(200).json(
        new ApiResponse(
            200,
            video,
            `Video ${video.isPublished ? "published" : "unpublished"} successfully`
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
