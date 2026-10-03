// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ICazatalentos} from "./ICazatalentos.sol";

/// @title Cazatalentos
/// @notice Phase 1: artist registration and belief signing with ranked weights.
contract Cazatalentos is ICazatalentos {
    uint256 public immutable MIN_STAKE;
    uint64 public immutable VOTE_WINDOW;
    uint64 public immutable MAX_POOL_DURATION;
    uint16 public immutable QUORUM_BPS;
    uint16 public immutable APPROVAL_BPS;

    uint256 private _nextArtistId = 1;

    mapping(uint256 => Artist) private _artists;
    mapping(uint256 => mapping(address => Supporter)) private _supporters;
    mapping(uint256 => uint256) public stakedByArtist;

    /// @notice Deploys with immutable protocol parameters used in later phases.
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
    function weightForRank(uint32 rank) public pure returns (uint8) {
        if (rank == 0) revert InvalidParameter("rank");
        if (rank <= 10) return 5;
        if (rank <= 50) return 3;
        if (rank <= 200) return 2;
        return 1;
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
}
