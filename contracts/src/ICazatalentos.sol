// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ICazatalentos {
    struct Artist {
        address owner;
        uint32 supporterCount;
        string metadataURI;
        bool exists;
    }

    struct Supporter {
        uint32 rank;
        uint8 weight;
        uint64 signedAt;
        uint256 stake;
    }

    enum PoolStatus {
        Open,
        Claimed,
        Approved,
        Rejected,
        Reclaimed
    }

    struct Pool {
        uint256 artistId;
        uint256 amount;
        bytes32 milestoneHash;
        uint64 deadline;
        uint64 voteEnd;
        uint256 votesFor;
        uint256 votesAgainst;
        uint32 supportersAtOpen;
        uint256 totalWeightAtOpen;
        PoolStatus status;
        string evidenceURI;
    }

    event ArtistRegistered(uint256 indexed artistId, address indexed owner, string uri);
    event BeliefSigned(
        uint256 indexed artistId, address indexed supporter, uint32 rank, uint8 weight
    );
    event PoolOpened(
        uint256 indexed poolId,
        uint256 indexed artistId,
        uint256 amount,
        bytes32 milestoneHash,
        uint64 deadline
    );
    event MilestoneClaimed(uint256 indexed poolId, string evidenceURI, uint64 voteEnd);
    event Voted(uint256 indexed poolId, address indexed supporter, bool approve, uint256 weight);
    event PoolFinalized(uint256 indexed poolId, PoolStatus status);
    event RewardClaimed(uint256 indexed poolId, address indexed supporter, uint256 amount);
    event PoolReclaimed(uint256 indexed poolId, address indexed artist, uint256 amount);
    event StakeWithdrawn(uint256 indexed artistId, address indexed supporter, uint256 amount);

    /// @notice Custom errors (no require strings). Argument order is the deployed ABI:
    /// id first, then address. Do not flip to (address, uint256) without a new deploy.
    /// @notice Artist id does not exist.
    error ArtistDoesNotExist(uint256 artistId);
    /// @notice Metadata URI must be non-empty.
    error EmptyMetadataURI();
    /// @notice The artist owner cannot sign belief for their own artist.
    error ArtistOwnerCannotSign(uint256 artistId, address owner);
    /// @notice Supporter has already signed for this artist.
    error AlreadySigned(uint256 artistId, address supporter);
    /// @notice msg.value is below the minimum stake.
    error InsufficientStake(uint256 provided, uint256 required);
    /// @notice A constructor or function parameter is invalid.
    error InvalidParameter(string name);
    /// @notice Caller is not the artist owner.
    error NotArtistOwner(uint256 artistId, address caller);
    /// @notice Artist has no supporters yet.
    error NoSupportersYet(uint256 artistId);
    /// @notice Pool deadline is not within the allowed window.
    error InvalidDeadline(uint64 deadline, uint64 maxAllowed);
    /// @notice Pool id does not exist.
    error PoolDoesNotExist(uint256 poolId);
    /// @notice Pool is not in Open status.
    error PoolNotOpen(uint256 poolId, PoolStatus current);
    /// @notice Pool is not in Claimed status.
    error PoolNotClaimed(uint256 poolId, PoolStatus current);
    /// @notice Pool is not in Approved status.
    error PoolNotApproved(uint256 poolId, PoolStatus current);
    /// @notice Caller is not eligible for this pool action.
    error NotEligible(uint256 poolId, address caller);
    /// @notice Caller has already voted on this pool.
    error AlreadyVoted(uint256 poolId, address caller);
    /// @notice Caller has already claimed a reward for this pool.
    error AlreadyClaimed(uint256 poolId, address caller);
    /// @notice Voting window has closed.
    error VotingClosed(uint256 poolId, uint64 voteEnd);
    /// @notice Voting window is still open.
    error VotingStillOpen(uint256 poolId, uint64 voteEnd);
    /// @notice Pool deadline has passed.
    error DeadlinePassed(uint256 poolId, uint64 deadline);
    /// @notice Artist still has active pools blocking stake withdrawal.
    error HasActivePools(uint256 artistId, uint256 activeCount);
    /// @notice Supporter has no stake to withdraw.
    error NothingToWithdraw(uint256 artistId, address supporter);
    /// @notice Native transfer failed.
    error TransferFailed(address to, uint256 amount);

    /// @notice Registers a new artist with the given metadata URI.
    /// @param metadataURI Off-chain metadata URI (non-empty).
    /// @return artistId Newly assigned artist id (starts at 1).
    function registerArtist(string calldata metadataURI) external returns (uint256 artistId);

    /// @notice Signs belief in an artist by staking native currency.
    /// @param artistId Existing artist id.
    function signBelief(uint256 artistId) external payable;

    /// @notice Opens a milestone pool funded by the artist.
    /// @param artistId Artist that owns the pool.
    /// @param milestoneHash Hash of the milestone description.
    /// @param deadline Unix timestamp by which the milestone must be claimed.
    /// @return poolId Newly assigned pool id.
    function openPool(uint256 artistId, bytes32 milestoneHash, uint64 deadline)
        external
        payable
        returns (uint256 poolId);

    /// @notice Declares milestone completion and opens the vote window.
    /// @param poolId Open pool id.
    /// @param evidenceURI Off-chain evidence URI.
    function claimMilestone(uint256 poolId, string calldata evidenceURI) external;

    /// @notice Casts a weighted vote for or against a claimed milestone.
    /// @param poolId Claimed pool id.
    /// @param approve True to vote for approval.
    function vote(uint256 poolId, bool approve) external;

    /// @notice Finalizes voting after the vote window ends.
    /// @param poolId Claimed pool id with closed voting.
    function finalize(uint256 poolId) external;

    /// @notice Claims a proportional reward from an approved pool.
    /// @param poolId Approved pool id.
    function claimReward(uint256 poolId) external;

    /// @notice Reclaims pool funds after rejection or expired open deadline.
    /// @param poolId Rejected or expired-Open pool id.
    function reclaimPool(uint256 poolId) external;

    /// @notice Withdraws the caller's stake when the artist has no active pools.
    /// @param artistId Artist id the caller supported.
    function withdrawStake(uint256 artistId) external;

    /// @notice Returns artist data for an existing artist.
    /// @param artistId Artist id to look up.
    /// @return Artist struct.
    function artistOf(uint256 artistId) external view returns (Artist memory);

    /// @notice Returns supporter data; zero-struct if never signed.
    /// @param artistId Artist id.
    /// @param supporter Supporter address.
    /// @return Supporter struct.
    function supporterOf(uint256 artistId, address supporter)
        external
        view
        returns (Supporter memory);

    /// @notice Returns the fixed weight for a given rank.
    /// @param rank Rank starting at 1.
    /// @return weight Weight for that rank band.
    function weightForRank(uint32 rank) external pure returns (uint8 weight);

    /// @notice Total number of registered artists.
    /// @return Count of artists.
    function totalArtists() external view returns (uint256);

    /// @notice Returns pool data for an existing pool.
    /// @param poolId Pool id to look up.
    /// @return Pool struct.
    function poolOf(uint256 poolId) external view returns (Pool memory);

    /// @notice Total number of opened pools.
    /// @return Count of pools.
    function totalPools() external view returns (uint256);

    /// @notice Analytic sum of weightForRank(1..count) with no loops.
    /// @param count Number of supporters to sum.
    /// @return Total weight.
    function weightSumUpTo(uint32 count) external pure returns (uint256);

    /// @notice Whether a supporter has voted on a pool.
    /// @param poolId Pool id.
    /// @param supporter Supporter address.
    /// @return True if already voted.
    function hasVoted(uint256 poolId, address supporter) external view returns (bool);

    /// @notice Whether a supporter has claimed a reward for a pool.
    /// @param poolId Pool id.
    /// @param supporter Supporter address.
    /// @return True if already claimed.
    function hasClaimed(uint256 poolId, address supporter) external view returns (bool);

    /// @notice Number of pools in Open or Claimed status for an artist.
    /// @param artistId Artist id.
    /// @return Active pool count.
    function activePoolsByArtist(uint256 artistId) external view returns (uint256);
}
