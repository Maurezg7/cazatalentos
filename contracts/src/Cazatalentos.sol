// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICazatalentos} from "./ICazatalentos.sol";

/// @title Cazatalentos
/// @notice Artist registration, belief staking, and milestone pool voting protocol.
contract Cazatalentos is ICazatalentos, ReentrancyGuard {
    uint256 public immutable MIN_STAKE;
    uint64 public immutable VOTE_WINDOW;
    uint64 public immutable MAX_POOL_DURATION;
    uint16 public immutable QUORUM_BPS;
    uint16 public immutable APPROVAL_BPS;

    uint256 private _nextArtistId = 1;
    uint256 private _nextPoolId = 1;

    mapping(uint256 => Artist) private _artists;
    mapping(uint256 => mapping(address => Supporter)) private _supporters;
    mapping(uint256 => uint256) public stakedByArtist;
    mapping(uint256 => Pool) private _pools;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;
    mapping(uint256 => mapping(address => bool)) private _hasClaimed;
    mapping(uint256 => uint256) private _activePoolsByArtist;

    /// @notice Deploys with immutable protocol parameters.
    /// @param minStake Minimum native stake required to sign belief.
    /// @param voteWindow Voting window duration in seconds.
    /// @param maxPoolDuration Maximum pool duration in seconds.
    /// @param quorumBps Quorum threshold in basis points (1–10_000).
    /// @param approvalBps Approval threshold in basis points (1–10_000).
    constructor(
        uint256 minStake,
        uint64 voteWindow,
        uint64 maxPoolDuration,
        uint16 quorumBps,
        uint16 approvalBps
    ) {
        if (minStake == 0) revert InvalidParameter("minStake");
        if (voteWindow == 0) revert InvalidParameter("voteWindow");
        if (maxPoolDuration == 0) revert InvalidParameter("maxPoolDuration");
        if (quorumBps == 0 || quorumBps > 10_000) revert InvalidParameter("quorumBps");
        if (approvalBps == 0 || approvalBps > 10_000) revert InvalidParameter("approvalBps");

        MIN_STAKE = minStake;
        VOTE_WINDOW = voteWindow;
        MAX_POOL_DURATION = maxPoolDuration;
        QUORUM_BPS = quorumBps;
        APPROVAL_BPS = approvalBps;
    }

    /// @inheritdoc ICazatalentos
    function registerArtist(string calldata metadataURI) external returns (uint256 artistId) {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        artistId = _nextArtistId++;
        _artists[artistId] = Artist(msg.sender, 0, metadataURI, true);

        emit ArtistRegistered(artistId, msg.sender, metadataURI);
    }

    /// @inheritdoc ICazatalentos
    function signBelief(uint256 artistId) external payable {
        Artist storage a = _artists[artistId];
        if (!a.exists) revert ArtistDoesNotExist(artistId);
        if (msg.sender == a.owner) revert ArtistOwnerCannotSign(artistId, a.owner);
        if (_supporters[artistId][msg.sender].rank != 0) {
            revert AlreadySigned(artistId, msg.sender);
        }
        if (msg.value < MIN_STAKE) revert InsufficientStake(msg.value, MIN_STAKE);

        uint32 rank = ++a.supporterCount;
        uint8 weight = weightForRank(rank);
        // casting to 'uint64' is safe because block.timestamp will not exceed uint64.max for ~5.8e11 years
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 signedAt = uint64(block.timestamp);
        _supporters[artistId][msg.sender] = Supporter(rank, weight, signedAt, msg.value);
        stakedByArtist[artistId] += msg.value;

        emit BeliefSigned(artistId, msg.sender, rank, weight);
    }

    /// @inheritdoc ICazatalentos
    function openPool(uint256 artistId, bytes32 milestoneHash, uint64 deadline)
        external
        payable
        returns (uint256 poolId)
    {
        Artist storage a = _artists[artistId];
        if (!a.exists) revert ArtistDoesNotExist(artistId);
        if (msg.sender != a.owner) revert NotArtistOwner(artistId, msg.sender);
        if (msg.value == 0) revert InvalidParameter("amount");
        if (a.supporterCount == 0) revert NoSupportersYet(artistId);

        // casting to 'uint64' is safe because block.timestamp will not exceed uint64.max for ~5.8e11 years
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 maxDeadline = uint64(block.timestamp) + MAX_POOL_DURATION;
        if (deadline <= block.timestamp || deadline > maxDeadline) {
            revert InvalidDeadline(deadline, maxDeadline);
        }

        poolId = _nextPoolId++;
        _pools[poolId] = Pool({
            artistId: artistId,
            amount: msg.value,
            milestoneHash: milestoneHash,
            deadline: deadline,
            voteEnd: 0,
            votesFor: 0,
            votesAgainst: 0,
            supportersAtOpen: a.supporterCount,
            totalWeightAtOpen: weightSumUpTo(a.supporterCount),
            status: PoolStatus.Open,
            evidenceURI: ""
        });
        _activePoolsByArtist[artistId] += 1;

        emit PoolOpened(poolId, artistId, msg.value, milestoneHash, deadline);
    }

    /// @inheritdoc ICazatalentos
    function claimMilestone(uint256 poolId, string calldata evidenceURI) external {
        Pool storage p = _pools[poolId];
        if (p.artistId == 0) revert PoolDoesNotExist(poolId);
        if (p.status != PoolStatus.Open) revert PoolNotOpen(poolId, p.status);

        Artist storage a = _artists[p.artistId];
        if (msg.sender != a.owner) revert NotArtistOwner(p.artistId, msg.sender);
        if (block.timestamp > p.deadline) revert DeadlinePassed(poolId, p.deadline);

        p.status = PoolStatus.Claimed;
        // casting to 'uint64' is safe because block.timestamp will not exceed uint64.max for ~5.8e11 years
        // forge-lint: disable-next-line(unsafe-typecast)
        p.voteEnd = uint64(block.timestamp) + VOTE_WINDOW;
        p.evidenceURI = evidenceURI;

        emit MilestoneClaimed(poolId, evidenceURI, p.voteEnd);
    }

    /// @inheritdoc ICazatalentos
    function vote(uint256 poolId, bool approve) external {
        Pool storage p = _pools[poolId];
        if (p.artistId == 0) revert PoolDoesNotExist(poolId);
        if (p.status != PoolStatus.Claimed) revert PoolNotClaimed(poolId, p.status);
        if (block.timestamp >= p.voteEnd) revert VotingClosed(poolId, p.voteEnd);

        Supporter storage s = _supporters[p.artistId][msg.sender];
        if (s.rank == 0 || s.rank > p.supportersAtOpen) revert NotEligible(poolId, msg.sender);
        if (_hasVoted[poolId][msg.sender]) revert AlreadyVoted(poolId, msg.sender);

        _hasVoted[poolId][msg.sender] = true;
        if (approve) {
            p.votesFor += s.weight;
        } else {
            p.votesAgainst += s.weight;
        }

        emit Voted(poolId, msg.sender, approve, s.weight);
    }

    /// @inheritdoc ICazatalentos
    function finalize(uint256 poolId) external {
        Pool storage p = _pools[poolId];
        if (p.artistId == 0) revert PoolDoesNotExist(poolId);
        if (p.status != PoolStatus.Claimed) revert PoolNotClaimed(poolId, p.status);
        if (block.timestamp < p.voteEnd) revert VotingStillOpen(poolId, p.voteEnd);

        uint256 totalVotes = p.votesFor + p.votesAgainst;
        uint256 quorumNeeded = (p.totalWeightAtOpen * QUORUM_BPS) / 10_000;
        bool quorumMet = totalVotes >= quorumNeeded;
        bool majorityMet = totalVotes > 0 && (p.votesFor * 10_000) > (totalVotes * APPROVAL_BPS);

        p.status = (quorumMet && majorityMet) ? PoolStatus.Approved : PoolStatus.Rejected;
        _activePoolsByArtist[p.artistId] -= 1;

        emit PoolFinalized(poolId, p.status);
    }

    /// @inheritdoc ICazatalentos
    function claimReward(uint256 poolId) external nonReentrant {
        Pool storage p = _pools[poolId];
        if (p.artistId == 0) revert PoolDoesNotExist(poolId);
        if (p.status != PoolStatus.Approved) revert PoolNotApproved(poolId, p.status);

        Supporter storage s = _supporters[p.artistId][msg.sender];
        if (s.rank == 0 || s.rank > p.supportersAtOpen) revert NotEligible(poolId, msg.sender);
        if (_hasClaimed[poolId][msg.sender]) revert AlreadyClaimed(poolId, msg.sender);

        uint256 reward = (p.amount * s.weight) / p.totalWeightAtOpen;
        _hasClaimed[poolId][msg.sender] = true;

        emit RewardClaimed(poolId, msg.sender, reward);

        // Safe: state is updated before the call (CEI) and nonReentrant is active.
        // forge-lint: disable-next-line(reentrancy-eth)
        (bool ok,) = payable(msg.sender).call{value: reward}("");
        if (!ok) revert TransferFailed(msg.sender, reward);
    }

    /// @inheritdoc ICazatalentos
    function reclaimPool(uint256 poolId) external nonReentrant {
        Pool storage p = _pools[poolId];
        if (p.artistId == 0) revert PoolDoesNotExist(poolId);

        Artist storage a = _artists[p.artistId];
        if (msg.sender != a.owner) revert NotArtistOwner(p.artistId, msg.sender);

        bool isRejected = p.status == PoolStatus.Rejected;
        bool isExpiredOpen = p.status == PoolStatus.Open && block.timestamp > p.deadline;
        if (!isRejected && !isExpiredOpen) revert InvalidParameter("status");

        uint256 amount = p.amount;
        p.amount = 0;
        p.status = PoolStatus.Reclaimed;
        if (isExpiredOpen) {
            _activePoolsByArtist[p.artistId] -= 1;
        }

        emit PoolReclaimed(poolId, msg.sender, amount);

        // Safe: state is updated before the call (CEI) and nonReentrant is active.
        // forge-lint: disable-next-line(reentrancy-eth)
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed(msg.sender, amount);
    }

    /// @inheritdoc ICazatalentos
    function withdrawStake(uint256 artistId) external nonReentrant {
        Artist storage a = _artists[artistId];
        if (!a.exists) revert ArtistDoesNotExist(artistId);

        Supporter storage s = _supporters[artistId][msg.sender];
        if (s.stake == 0) revert NothingToWithdraw(artistId, msg.sender);

        uint256 active = _activePoolsByArtist[artistId];
        if (active > 0) revert HasActivePools(artistId, active);

        uint256 amount = s.stake;
        s.stake = 0;
        stakedByArtist[artistId] -= amount;

        emit StakeWithdrawn(artistId, msg.sender, amount);

        // Safe: state is updated before the call (CEI) and nonReentrant is active.
        // forge-lint: disable-next-line(reentrancy-eth)
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed(msg.sender, amount);
    }

    /// @inheritdoc ICazatalentos
    function weightForRank(uint32 rank) public pure returns (uint8) {
        if (rank == 0) revert InvalidParameter("rank");
        if (rank <= 10) return 5;
        if (rank <= 50) return 3;
        if (rank <= 200) return 2;
        return 1;
    }

    /// @inheritdoc ICazatalentos
    function weightSumUpTo(uint32 count) public pure returns (uint256) {
        if (count == 0) return 0;

        uint256 n = uint256(count);
        uint256 t1 = n < 10 ? n : 10;
        uint256 t2 = n > 10 ? ((n < 50 ? n : 50) - 10) : 0;
        uint256 t3 = n > 50 ? ((n < 200 ? n : 200) - 50) : 0;
        uint256 t4 = n > 200 ? (n - 200) : 0;
        return t1 * 5 + t2 * 3 + t3 * 2 + t4;
    }

    /// @inheritdoc ICazatalentos
    function artistOf(uint256 artistId) external view returns (Artist memory) {
        if (!_artists[artistId].exists) revert ArtistDoesNotExist(artistId);
        return _artists[artistId];
    }

    /// @inheritdoc ICazatalentos
    function supporterOf(uint256 artistId, address supporter)
        external
        view
        returns (Supporter memory)
    {
        return _supporters[artistId][supporter];
    }

    /// @inheritdoc ICazatalentos
    function totalArtists() external view returns (uint256) {
        return _nextArtistId - 1;
    }

    /// @inheritdoc ICazatalentos
    function poolOf(uint256 poolId) external view returns (Pool memory) {
        if (_pools[poolId].artistId == 0) revert PoolDoesNotExist(poolId);
        return _pools[poolId];
    }

    /// @inheritdoc ICazatalentos
    function totalPools() external view returns (uint256) {
        return _nextPoolId - 1;
    }

    /// @inheritdoc ICazatalentos
    function hasVoted(uint256 poolId, address supporter) external view returns (bool) {
        return _hasVoted[poolId][supporter];
    }

    /// @inheritdoc ICazatalentos
    function hasClaimed(uint256 poolId, address supporter) external view returns (bool) {
        return _hasClaimed[poolId][supporter];
    }

    /// @inheritdoc ICazatalentos
    function activePoolsByArtist(uint256 artistId) external view returns (uint256) {
        return _activePoolsByArtist[artistId];
    }
}
